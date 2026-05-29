const path = require('path');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();

// Centralized reference bindings depending on runtime environments
let dbInstance = null;
const isPostgres = !!process.env.DATABASE_URL;

if (isPostgres) {
  console.log('[db] Production Detected. Initializing Cloud Neon PostgreSQL Pool...');
  dbInstance = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false // Enforces strict SSL wrapping required by Neon/Render gateways
    }
  });
} else {
  const dbPath = path.join(__dirname, './retrace.db');
  console.log('[db] Local Environment Detected. Initializing SQLite connection at:', dbPath);
  dbInstance = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('[db] Error opening local SQLite file:', err.message);
  });
}

/**
 * 🚀 Promisified Bridge Export Interface
 * Bulletproof array normalization for both SQLite and Cloud PostgreSQL
 */
module.exports = {
  query: async (sql, params = []) => {
    if (isPostgres) {
      return await dbInstance.query(sql, params);
    } else {
      // Compatibility shim: SQLite uses '?' placeholder hooks, Postgres uses '$1' tags
      const adjustedSql = sql.replace(/\$(\d+)/g, '?');
      return new Promise((resolve, reject) => {
        dbInstance.all(adjustedSql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const data = rows || [];
            // 🔑 Dual-compatibility mapping pattern:
            // Acts as a direct array, but also contains a .rows property for Postgres compatibility
            Object.defineProperty(data, 'rows', {
              value: data,
              writable: true,
              enumerable: false, // Prevents array loop pollution
              configurable: true
            });
            resolve(data);
          }
        });
      });
    }
  },
  
  // Legacy wrappers updated to maintain consistent object arrays
  run: (sql, params = []) => {
    if (isPostgres) {
      const adjustedSql = sql.replace(/\?/g, (_, index) => `$${index + 1}`);
      return dbInstance.query(adjustedSql, params);
    }
    return new Promise((resolve, reject) => {
      dbInstance.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes, rows: [] });
      });
    });
  },

  get: (sql, params = []) => {
    if (isPostgres) {
      return dbInstance.query(sql, params).then(res => res.rows[0]);
    }
    return new Promise((resolve, reject) => {
      dbInstance.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

// ⚙️ Auto-initialize schemas safely across both database environments
;(async function initDbSchema() {
  try {
    console.log('[db] Scanning database schemas for platform alignment...');

    if (isPostgres) {
      // 🐘 Ensure table architectures match perfectly inside Neon PostgreSQL cloud space
      await dbInstance.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          profile_picture TEXT,
          google_id TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await dbInstance.query(`
        CREATE TABLE IF NOT EXISTS vendors (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await dbInstance.query(`
        CREATE TABLE IF NOT EXISTS ingestion_logs (
          id SERIAL PRIMARY KEY,
          filename TEXT,
          file_size_bytes BIGINT,
          status TEXT DEFAULT 'processing',
          rows_total INTEGER,
          rows_repaired INTEGER,
          reconstruction_confidence REAL,
          error_message TEXT,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          processed_at TIMESTAMP
        );
      `);

      await dbInstance.query(`
        CREATE TABLE IF NOT EXISTS reconstructed_shipments (
          id SERIAL PRIMARY KEY,
          vendor_id TEXT REFERENCES vendors(id),
          ingestion_log_id INTEGER REFERENCES ingestion_logs(id),
          external_id TEXT,
          shipment_id TEXT,
          vendor_name TEXT,
          material_type TEXT,
          weight_kg REAL,
          predicted_delay_hours REAL,
          predicted_delay_risk REAL,
          primary_delay_driver TEXT,
          freight_cost_usd REAL,
          origin_hub TEXT,
          destination_hub TEXT,
          departure_date TIMESTAMP,
          eta TIMESTAMP,
          original_structure_status TEXT,
          imputed_fields TEXT,
          status TEXT,
          origin_lat REAL,
          origin_lng REAL,
          destination_lat REAL,
          destination_lng REAL
        );
      `);

      await dbInstance.query(`
        INSERT INTO vendors (id, name)
        VALUES ('00000000-0000-0000-0000-000000000000', 'Default Vendor')
        ON CONFLICT (id) DO NOTHING;
      `);

      console.log('[db] Cloud Neon PostgreSQL schemas validated successfully.');
    } else {
      // 💾 Standard SQLite Local Matrix Routine
      dbInstance.serialize(() => {
        // 🔑 Added missing users table fallback schema layout locally!
        dbInstance.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            profile_picture TEXT,
            google_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        dbInstance.run(`
          CREATE TABLE IF NOT EXISTS vendors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        dbInstance.run(`
          CREATE TABLE IF NOT EXISTS ingestion_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            file_size_bytes INTEGER,
            status TEXT DEFAULT 'processing',
            rows_total INTEGER,
            rows_repaired INTEGER,
            reconstruction_confidence REAL,
            error_message TEXT,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            processed_at DATETIME
          )
        `);

        dbInstance.run(`
          CREATE TABLE IF NOT EXISTS reconstructed_shipments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vendor_id TEXT REFERENCES vendors(id),
            ingestion_log_id INTEGER REFERENCES ingestion_logs(id),
            external_id TEXT,
            shipment_id TEXT,
            vendor_name TEXT,
            material_type TEXT,
            weight_kg REAL,
            predicted_delay_hours REAL,
            predicted_delay_risk REAL,
            primary_delay_driver TEXT,
            freight_cost_usd REAL,
            origin_hub TEXT,
            destination_hub TEXT,
            departure_date DATETIME,
            eta DATETIME,
            original_structure_status TEXT,
            imputed_fields TEXT,
            status TEXT,
            origin_lat REAL,
            origin_lng REAL,
            destination_lat REAL,
            destination_lng REAL
          )
        `);

        dbInstance.run(`
          INSERT INTO vendors (id, name)
          SELECT '00000000-0000-0000-0000-000000000000', 'Default Vendor'
          WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE id = '00000000-0000-0000-0000-000000000000')
        `);
      });
      console.log('[db] Local SQLite schemas validated successfully.');
    }
  } catch (err) {
    console.error('[db] Schema configuration loop failure:', err.message);
  }
})();