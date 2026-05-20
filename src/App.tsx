import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './views/Dashboard'
import UploadHub from './views/UploadHub'
import DataInspector from './views/DataInspector'
import GISView from './views/GISView'
import type { View } from './types'

// 1. Sleek, Premium System Alerts Panel
function AlertsView() {
  const alertsList = [
    {
      id: 'ALT-101',
      title: 'XGBoost Feature Imputation Success',
      description: 'Zero weights detected for SHP-3004 and SHP-3009. Imputed dynamic material baseline (Apparel: 80.0kg, general fallback: 250.0kg).',
      type: 'success',
      time: 'Just now',
    },
    {
      id: 'ALT-102',
      title: 'Critical Delivery Delay Risk',
      description: 'Shipment SHP-3003 (Chemicals, BLR_HUB → HYD_HUB) predicted delay hours at 26.0 hrs exceeds high risk warning threshold (>12 hrs).',
      type: 'critical',
      time: '12 min ago',
    },
    {
      id: 'ALT-103',
      title: 'SQLite Database Commit Complete',
      description: 'Successfully resolved 19 unique logistics rows from matrix manifest. Committed records securely to local table "reconstructed_shipments".',
      type: 'info',
      time: '34 min ago',
    },
  ]

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Active Pipeline Alerts</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time telemetry reports and engine exception logs</p>
        </div>
        <span className="badge-red text-xs px-2.5 py-1 flex items-center gap-1.5 font-semibold bg-red-500/10 text-red-400 border border-red-500/15 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
          1 Warning Active
        </span>
      </div>

      <div className="space-y-4">
        {alertsList.map((a) => (
          <div
            key={a.id}
            className={`glass-card p-5 rounded-xl border transition-all duration-150 hover:bg-slate-900/40
              ${a.type === 'critical' ? 'border-red-500/20 bg-red-500/5' : a.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-blue-500/20 bg-blue-500/5'}
            `}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase
                    ${a.type === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : a.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}
                  `}>
                    {a.type}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono">{a.id}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">{a.title}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{a.description}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{a.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 2. High-Tech System Configuration Control Panel
function SettingsView() {
  const [confidence, setConfidence] = useState(85)
  const [autoBackup, setAutoBackup] = useState(true)
  const [imputationMode, setImputationMode] = useState('median')

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure ML thresholds, SQLite database retention, and network gateways</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/20">
          <h3 className="text-sm font-semibold text-white mb-2">ML Inference Confidence Guard</h3>
          <p className="text-xs text-slate-500 mb-4">Minimum acceptable confidence metric from adaptive engine before triggering manual verification.</p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="50"
              max="99"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-sm font-bold font-mono text-blue-400 w-10 text-right">{confidence}%</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/20">
          <h3 className="text-sm font-semibold text-white mb-2">Imputation & Imbalance Framework</h3>
          <p className="text-xs text-slate-500 mb-4">Select statistical strategy utilized by downstream classifiers for physical missing dimensions (weights/delays).</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'median', label: 'Material Dynamic Median', desc: 'Auto-maps fallback based on cargo material category (Recommended)' },
              { id: 'baseline', label: 'Static Weight Baseline', desc: 'Forces standard 250.0kg fallback for all values' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setImputationMode(opt.id)}
                className={`text-left p-3.5 rounded-lg border transition-all duration-150
                  ${imputationMode === opt.id ? 'border-blue-500 bg-blue-500/5 text-blue-400' : 'border-slate-800 bg-slate-900/40 text-slate-400'}
                `}
              >
                <p className="text-xs font-bold">{opt.label}</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/20 flex items-center justify-between gap-6">
          <div>
            <h3 className="text-sm font-semibold text-white">Automated SQLite Backups</h3>
            <p className="text-xs text-slate-500 mt-1">Triggers non-destructive cron snapshots of "retrace.db" on successful ingestions.</p>
          </div>
          <button
            onClick={() => setAutoBackup(!autoBackup)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center
              ${autoBackup ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'}
            `}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out" />
          </button>
        </div>
      </div>
    </div>
  )
}

// 3. Technical Reference and Documentation Panel
function DocumentationView() {
  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight">Pipeline Reference & API Guide</h1>
        <p className="text-xs text-slate-500 mt-1">Technical specifications of Retrace logistics reconstruction schema</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/20">
          <h3 className="text-sm font-semibold text-white mb-3">System Architecture</h3>
          <div className="p-4 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400 border border-slate-800/80 leading-relaxed overflow-x-auto whitespace-pre">
{`┌───────────────────────┐         ┌─────────────────────────┐         ┌────────────────────────┐
│  React View Upload    │ ──────> │  Express Ingest gateway │ ──────> │   Python Data Engine   │
│  (.csv / .xlsx files) │ <────── │  (server/routes/ingest) │ <────── │   (data-engine/main)   │
└───────────────────────┘         └────────────┬────────────┘         └────────────────────────┘
                                               │
                                               ▼
                                  ┌─────────────────────────┐
                                  │   SQLite Local DB       │
                                  │   (retrace.db / db.js)  │
                                  └─────────────────────────┘`}
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/20">
          <h3 className="text-sm font-semibold text-white mb-2">Ingestion Endpoint Schema</h3>
          <p className="text-xs text-slate-500 mb-3">Multipart file upload forwarding payload structure.</p>
          <div className="p-4 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-400 border border-slate-800/80 leading-relaxed">
            <p className="text-blue-400 font-bold mb-1">POST http://localhost:8000/api/process-manifest</p>
            <p className="text-slate-500 mb-2">// Payload: form-data file parameter</p>
            <p className="text-slate-200">Response Object:</p>
            <pre className="text-slate-300 text-[10px] mt-1">{`{
  "status": "reconstructed",
  "confidence": 0.95,
  "anomalies_repaired": 3,
  "data": [
    {
      "shipment_id": "SHP-3001",
      "origin_hub": "MUM_HUB",
      "destination_hub": "DEL_HUB",
      "material_type": "Electronics",
      "weight_kg": 150.0,
      "predicted_delay_hours": 1.5,
      "status": "processing"
    }
  ]
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard')

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 overflow-y-auto">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'upload' && <UploadHub onNavigate={setCurrentView} />}
        {currentView === 'inspector' && <DataInspector />}
        {currentView === 'gis' && <GISView />}
        {currentView === 'alerts' && <AlertsView />}
        {currentView === 'settings' && <SettingsView />}
        {currentView === 'documentation' && <DocumentationView />}
      </main>
    </div>
  )
}
