-- ============================================================
-- Retrace — PostgreSQL Database Schema
-- Version: 1.0.0
-- ============================================================
-- This schema defines the normalized tables for the Retrace
-- adaptive logistics data reconstruction platform.
--
-- Tables:
--   vendors                  — registered vendor/supplier master
--   ingestion_logs           — one row per file upload attempt
--   reconstructed_shipments  — cleaned, ML-annotated shipment rows
--   model_runs               — XGBoost training run metadata
--   xgboost_feature_importance — feature weights per model run
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- Table: vendors
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  tier               SMALLINT NOT NULL CHECK (tier BETWEEN 1 AND 4),
  country            TEXT NOT NULL,
  region             TEXT NOT NULL,         -- APAC | EMEA | AMER | LATAM
  hub_code           TEXT NOT NULL UNIQUE,  -- e.g. ICN-HUB-01
  reliability_score  NUMERIC(5,2) NOT NULL DEFAULT 0.0 CHECK (reliability_score BETWEEN 0 AND 100),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vendors_region_idx ON vendors (region);
CREATE INDEX IF NOT EXISTS vendors_tier_idx   ON vendors (tier);

-- ─────────────────────────────────────────────
-- Table: ingestion_logs
-- ─────────────────────────────────────────────
-- One row is inserted immediately when a file arrives (status='queued').
-- The Python ML service updates it to 'processing' → 'success'|'failed'.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename                    TEXT NOT NULL,
  file_size_bytes             BIGINT NOT NULL DEFAULT 0,
  status                      TEXT NOT NULL DEFAULT 'queued'
                                CHECK (status IN ('queued','processing','success','failed')),
  rows_total                  INTEGER NOT NULL DEFAULT 0,
  rows_repaired               INTEGER NOT NULL DEFAULT 0,
  reconstruction_confidence   NUMERIC(5,2) NOT NULL DEFAULT 0.0,  -- 0.00–100.00
  error_message               TEXT,
  uploaded_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at                TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ingestion_logs_status_idx      ON ingestion_logs (status);
CREATE INDEX IF NOT EXISTS ingestion_logs_uploaded_at_idx ON ingestion_logs (uploaded_at DESC);

-- ─────────────────────────────────────────────
-- Table: reconstructed_shipments
-- ─────────────────────────────────────────────
-- Each row represents a single cleaned & ML-scored shipment.
-- imputed_fields stores the JSON array of field names that were
-- auto-imputed during reconstruction (e.g. ["departure_timestamp","cargo_weight_kg"]).
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reconstructed_shipments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id               TEXT NOT NULL UNIQUE,        -- e.g. RTC-2024-084721
  vendor_id                 UUID REFERENCES vendors(id),
  ingestion_log_id          UUID NOT NULL REFERENCES ingestion_logs(id),
  material_type             TEXT NOT NULL,
  origin_hub                TEXT NOT NULL,
  destination_hub           TEXT NOT NULL,
  original_structure_status TEXT NOT NULL DEFAULT 'clean'
                              CHECK (original_structure_status IN ('clean','repaired','partial','critical')),
  imputed_fields            JSONB NOT NULL DEFAULT '[]',         -- string[]
  predicted_delay_risk      NUMERIC(4,3) NOT NULL DEFAULT 0.0   -- 0.000–1.000
                              CHECK (predicted_delay_risk BETWEEN 0 AND 1),
  predicted_delay_hours     NUMERIC(6,1) NOT NULL DEFAULT 0.0,
  primary_delay_driver      TEXT NOT NULL DEFAULT 'None',
  freight_cost_usd          NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  departure_date            DATE NOT NULL,
  eta                       DATE NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'on_time'
                              CHECK (status IN ('on_time','minor_delay','high_delay')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rs_vendor_id_idx            ON reconstructed_shipments (vendor_id);
CREATE INDEX IF NOT EXISTS rs_ingestion_log_id_idx     ON reconstructed_shipments (ingestion_log_id);
CREATE INDEX IF NOT EXISTS rs_status_idx               ON reconstructed_shipments (status);
CREATE INDEX IF NOT EXISTS rs_predicted_delay_risk_idx ON reconstructed_shipments (predicted_delay_risk DESC);
CREATE INDEX IF NOT EXISTS rs_departure_date_idx       ON reconstructed_shipments (departure_date);

-- ─────────────────────────────────────────────
-- Table: model_runs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS model_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version   TEXT NOT NULL,           -- e.g. 'xgb-v2.1.4'
  training_rows   INTEGER NOT NULL DEFAULT 0,
  validation_auc  NUMERIC(5,4),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Table: xgboost_feature_importance
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS xgboost_feature_importance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_run_id    UUID NOT NULL REFERENCES model_runs(id),
  feature_name    TEXT NOT NULL,
  importance      NUMERIC(6,4) NOT NULL,    -- 0.0000–1.0000
  category        TEXT NOT NULL,            -- vendor|location|environmental|structural|temporal
  rank            SMALLINT NOT NULL
);

CREATE INDEX IF NOT EXISTS xgb_fi_model_run_idx ON xgboost_feature_importance (model_run_id);

-- ─────────────────────────────────────────────
-- Seed: Vendor master data
-- ─────────────────────────────────────────────
INSERT INTO vendors (name, tier, country, region, hub_code, reliability_score) VALUES
  ('Hanaro Logistics KR',       1, 'South Korea',  'APAC', 'ICN-HUB-01',     78.4),
  ('Shenzhen Premier Freight',  2, 'China',         'APAC', 'SZX-PORT-02',    83.1),
  ('VDA AutoParts GmbH',        1, 'Germany',       'EMEA', 'MUC-HUB-01',     96.2),
  ('Mumbai Precision Parts',    3, 'India',         'APAC', 'BOM-PORT-01',    61.7),
  ('Nordic Supply AS',          2, 'Norway',        'EMEA', 'OSL-HUB-01',     89.5),
  ('PT Nusantara Cargo',        3, 'Indonesia',     'APAC', 'CGK-PORT-01',    74.8),
  ('Guangzhou TechLink',        2, 'China',         'APAC', 'CAN-PORT-01',    81.3),
  ('Texas Industrial Supply',   2, 'United States', 'AMER', 'HOU-DIST-01',    92.0)
ON CONFLICT (hub_code) DO NOTHING;
