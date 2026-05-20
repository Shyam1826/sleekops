# SleekOps Retrograde Tracking: Adaptive Data Engine & GIS Platform

A high-resilience, full-stack logistics ingestion platform that intelligently processes, cleans, and visualizes highly volatile, schema-fluid shipping manifest matrices onto an interactive GIS map pipeline.

## 🚀 Core Features & Architectural Safeguards

* **Adaptive Header Horizon Discovery:** Automatically evaluates multi-row matrix topography to pinpoint the inflection dividing text/meta blocks from active rows. Handles complex multi-level headers or standard 1-row formats seamlessly.
* **Intelligent Column Auto-Allocation:** Features text-to-number data profiling. If a custom data payload transfers alternative metrics (like Volume $m^3$ or Disruption Index) instead of standard variables, the data engine classifies and pipes them cleanly into schema placeholders without dropping variables or throwing coercion errors.
* **Fault-Tolerant Engine Cross-Boundary Sync:** Built with defensive type-agnostic `object` DataFrames. Shunts physical cell structural shifting and array rotations securely, preventing `TypeError` string-insertion loops and `502 Bad Gateway` timeouts.
* **Dynamic Viewport Bounding Canvas:** Leverages Leaflet's native `.flatMap()` extraction with coordinate filtration routines to dynamically calculate map coordinates, snapping map boundaries instantly to center active hub paths perfectly.
* **Front-End State Flush Logic:** Includes an atomic database table wipe pathway triggered right from the user interface to quickly cycle between completely different file formats.

## 🛠️ Technology Stack

* **Frontend UI:** React 18, Vite, TypeScript, Leaflet GIS Mapping Engine, Tailwind CSS
* **Express Gateway Server:** Node.js, SQLite3 (persistent local bulk data caching), Axios
* **Adaptive Parsing Server:** Python 3, FastAPI, Uvicorn, Pandas Data Framework, NumPy

## 📂 Project Directory Structure

```text
Sleekops/
├── src/                           # React Dashboard Frontend Views
│   ├── views/                     # Map GIS views & Data Inspect layout tables
│   └── main.tsx
├── server/                        # Express Backend Gateway System
│   ├── routes/ingest.js           # Schema ingestion routes & database operations
│   └── index.js
├── data-engine/                   # FastAPI Python Microservice
│   └── main.py                    # Dynamic multi-pass parsing and mapping engine
└── adaptive_reconstruction_engine # Core ML Alignment & Reconstruction Routines