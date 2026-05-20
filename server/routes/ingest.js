const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const db = require('../db');

const router = express.Router();

// Ensure this matches your Python FastAPI port
const PYTHON_ENGINE_URL = process.env.PYTHON_ENGINE_URL || 'http://localhost:8000';

/**
 * MULTER CONFIGURATION
 * Stores files in /uploads before forwarding to AI Engine.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniquePrefix}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain'
  ];
  if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls|txt)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Format not supported. Please upload .csv, .xlsx, or .txt'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB Limit
});

/**
 * POST /api/ingest/upload
 * The primary entry point for the Retrace Data Pipeline.
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file provided.' });
  }

  let logId;
  try {
    // 1. Log the start of the ingestion in SQLite
    const logInsert = await db.run(
      `INSERT INTO ingestion_logs (filename, file_size_bytes, status) 
       VALUES (?, ?, 'processing')`,
      [req.file.originalname, req.file.size]
    );
    logId = logInsert.lastID;

    // 2. Prepare Multipart Form Data for Python FastAPI
    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    // 3. Forward to Python AI Engine
    let mlResult;
    try {
      const { data } = await axios.post(
        `${PYTHON_ENGINE_URL}/api/process-manifest`,
        form,
        {
          headers: { ...form.getHeaders() },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 300000 // 5 minutes for heavy reconstruction
        }
      );
      mlResult = data;
    } catch (mlErr) {
      console.error('[Ingest] AI Engine request failed:', mlErr.message);
      
      await db.run(
        `UPDATE ingestion_logs SET status = 'failed', error_message = 'AI Reconstruction Engine Offline' WHERE id = ?`,
        [logId]
      );
      
      return res.status(502).json({
        success: false,
        error: 'AI Reconstruction Engine Offline',
        detail: mlErr.message
      });
    }

    // 4. Resolve Vendor Data Scope
    const defaultVendorUuid = '00000000-0000-0000-0000-000000000000';
    const vendorCheck = await db.get('SELECT id FROM vendors WHERE id = ?', [defaultVendorUuid]);
    const vendorId = vendorCheck ? vendorCheck.id : defaultVendorUuid;

    // ✅ FIXED CONTRACT EXTRACTION: Prioritize .data back from Python main.py API schema
    const cleanRecords = mlResult.data || mlResult.records || mlResult.processed_rows || mlResult.shipments || [];

    // ✅ GEOLOCATION COORDINATE DICTIONARY
    const geoCoordinateLibrary = {
      'MUM_HUB': { lat: 19.0760, lng: 72.8777 },
      'DEL_HUB': { lat: 28.7041, lng: 77.1025 },
      'BLR_HUB': { lat: 12.9716, lng: 77.5946 },
      'HYD_HUB': { lat: 17.3850, lng: 78.4867 },
      'MAA_HUB': { lat: 13.0827, lng: 80.2707 }
    };

    if (cleanRecords.length > 0) {
      // Fetch all existing shipment_ids to perform pre-insert deduplication
      const existingRows = await db.all('SELECT shipment_id FROM reconstructed_shipments WHERE shipment_id IS NOT NULL');
      const existingShipmentIds = new Set(existingRows.map(row => row.shipment_id));

      const uniqueRecords = cleanRecords.filter(record => {
        const sid = record.shipment_id || record.id;
        if (!sid) return true;
        return !existingShipmentIds.has(sid);
      });

      if (uniqueRecords.length > 0) {
        const values = [];
        const placeholders = uniqueRecords.map((record, i) => {
          const sId = record.shipment_id;
          const extId = record.external_id || sId || `RE-${Date.now()}-${i}`; 
          const mat = record.material_type || 'General Cargo';
          const wt = record.weight_kg;
          const delay = record.predicted_delay_hours;
          const origin = record.origin_hub || 'MUM_HUB';
          const dest = record.destination_hub || 'DEL_HUB';
          const stat = record.status || 'processing';

          // Extract Coordinates from Geolocation Dictionary Library
          const originCoords = geoCoordinateLibrary[origin] || geoCoordinateLibrary['MUM_HUB'];
          const destCoords = geoCoordinateLibrary[dest] || geoCoordinateLibrary['DEL_HUB'];

          values.push(
            vendorId, 
            logId,
            sId,
            extId, 
            mat, 
            wt, 
            delay,
            stat,
            origin,
            dest,
            originCoords.lat,   // origin_lat
            originCoords.lng,   // origin_lng
            destCoords.lat,     // destination_lat
            destCoords.lng      // destination_lng
          );
          return `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        }).join(',');

        // Execute updated 14-column SQLite transaction
        await db.run(
          `INSERT OR IGNORE INTO reconstructed_shipments 
            (vendor_id, ingestion_log_id, shipment_id, external_id, material_type, weight_kg, predicted_delay_hours, status, origin_hub, destination_hub, origin_lat, origin_lng, destination_lat, destination_lng)
            VALUES ${placeholders}`,
          values
        );
        console.log(`[Ingest Core] Successfully committed ${uniqueRecords.length} unique spatial rows into SQLite.`);
      }
    } else {
      console.warn('[Ingest Core] No clean records to insert after processing. Check AI Engine output for details.');
    } 

    // 5. Finalize the Log Entry with Correct Object Key Accessors
    const finalConfidence = mlResult.confidence ? Math.round(mlResult.confidence * 100) : 95;
    const finalRows = cleanRecords.length; 
    const finalRepairs = mlResult.anomalies_repaired || 0;

    await db.run(
      `UPDATE ingestion_logs 
       SET status = 'success', 
           rows_total = ?, 
           rows_repaired = ?, 
           reconstruction_confidence = ?, 
           processed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [finalRows, finalRepairs, finalConfidence / 100, logId]
    );

    // Return payload tailored perfectly for UploadHub.tsx's summary extractor
    return res.json({
      success: true,
      logId,
      summary: {
        reconstruction_confidence: finalConfidence / 100,
        rows_total: finalRows,
        rows_repaired: finalRepairs
      }
    });

  } catch (err) {
    console.error('[Ingest] Failure:', err.response?.data || err.message);
    
    if (logId) {
      await db.run(
        `UPDATE ingestion_logs SET status = 'failed', error_message = ? WHERE id = ?`,
        [err.message, logId]
      );
    }

    return res.status(502).json({
      success: false,
      error: 'Data Reconstruction Pipeline Error',
      detail: err.message
    });

  } finally {
    // Cleanup temporary file storage blocks
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, (e) => { if (e) console.error('Cleanup Error:', e); });
    }
  }
});

/**
 * GET /api/ingest/status/:logId
 * Fetch status for the UI progress spinner.
 */
router.get('/status/:logId', async (req, res) => {
  try {
    const result = await db.all('SELECT * FROM ingestion_logs WHERE id = ?', [req.params.logId]);
    if (!result || !result.length) return res.status(404).json({ error: 'Log not found' });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;