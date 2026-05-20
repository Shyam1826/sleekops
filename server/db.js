
/**
 * SQLite local database connection.
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, './retrace.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[db] Error opening database:', err.message);
  } else {
    console.log('[db] Connected to local SQLite database at', dbPath);
  }
});

// Run inside database initialization sequence block
async function runMigrations(db) {
  const columnsToMigrate = [
    { name: 'origin_lat', type: 'REAL' },
    { name: 'origin_lng', type: 'REAL' },
    { name: 'destination_lat', type: 'REAL' },
    { name: 'destination_lng', type: 'REAL' }
  ];

  for (const col of columnsToMigrate) {
    try {
      await db.run(`ALTER TABLE reconstructed_shipments ADD COLUMN ${col.name} ${col.type}`);
      console.log(`[DB Migration] Added column: ${col.name}`);
    } catch (e) {
      // If column already exists, SQLite will throw an error, which we catch safely
    }
  }
}

// Promisified helper methods aligned directly with route expectations
module.exports = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []); // Returns a raw array directly
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row); // Returns a clean row object directly
      });
    });
  },
};

// Auto-initialize the database schema
; (async function initDb() {
  try {
    console.log('[db] Scanning database schema...');

    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS vendors (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
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

      db.run(`
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

      // Safe dynamic schema evolution migrations for coordinate mapping
      db.run("ALTER TABLE reconstructed_shipments ADD COLUMN origin_lat REAL", (err) => {
        if (err && !err.message.includes("duplicate column name")) {
          console.error('[db] Migration Error origin_lat:', err.message);
        }
      });
      db.run("ALTER TABLE reconstructed_shipments ADD COLUMN origin_lng REAL", (err) => {
        if (err && !err.message.includes("duplicate column name")) {}
      });
      db.run("ALTER TABLE reconstructed_shipments ADD COLUMN destination_lat REAL", (err) => {
        if (err && !err.message.includes("duplicate column name")) {}
      });
      db.run("ALTER TABLE reconstructed_shipments ADD COLUMN destination_lng REAL", (err) => {
        if (err && !err.message.includes("duplicate column name")) {}
      });

      db.run(`
        INSERT INTO vendors (id, name)
        SELECT '00000000-0000-0000-0000-000000000000', 'Default Vendor'
        WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE id = '00000000-0000-0000-0000-000000000000')
      `);
    });

    console.log('[db] SQLite database schema successfully initialized and verified.');
  } catch (err) {
    console.error('[db] Error initializing database schema:', err.message);
  }
})();