import { useState, useEffect } from 'react'
import Sidebar from './components/layout/Sidebar'
import Dashboard from './views/Dashboard'
import UploadHub from './views/UploadHub'
import DataInspector from './views/DataInspector'
import GISView from './views/GISView'
import { Login } from './views/Login' // 🔐 Mount your modern obsidian login view
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
      title: 'Cloud Database Commit Complete',
      description: 'Successfully resolved 19 unique logistics rows from matrix manifest. Committed records securely to cloud table "users" and Neon Postgres clusters.',
      type: 'info',
      time: '34 min ago',
    },
  ]

  return (
    <div className="p-8 animate-fade-in bg-[#090A0F]">
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
            className={`glass-panel p-5 rounded-xl transition-all duration-150 hover:bg-slate-900/40
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
  const [imputationMode, setImputationMode] = useState('median')

  return (
    <div className="p-8 animate-fade-in bg-[#090A0F]">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure ML thresholds and cloud gateway networks</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="glass-panel p-5 rounded-xl">
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

        <div className="glass-panel p-5 rounded-xl">
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
                className={`text-left p-3.5 rounded-lg border transition-all duration-150 cursor-pointer
                  ${imputationMode === opt.id ? 'border-blue-500 bg-blue-500/5 text-blue-400' : 'border-white/5 bg-slate-900/40 text-slate-400'}
                `}
              >
                <p className="text-xs font-bold">{opt.label}</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 3. Technical Reference and Documentation Panel
function DocumentationView() {
  return (
    <div className="p-8 animate-fade-in bg-[#090A0F]">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white tracking-tight">Pipeline Reference & API Guide</h1>
        <p className="text-xs text-slate-500 mt-1">Technical specifications of Retrace logistics reconstruction schema</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        <div className="glass-panel p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-3">System Architecture</h3>
          <div className="p-4 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-400 border border-white/5 leading-relaxed overflow-x-auto whitespace-pre">
{`┌───────────────────────┐         ┌─────────────────────────┐         ┌────────────────────────┐
│  React View Upload    │ ──────> │  Express Ingest Gateway │ ──────> │   Python Data Engine   │
│  (.csv / .xlsx files) │ <────── │  (server/routes/ingest) │ <────── │   (data-engine/main)   │
└───────────────────────┘         └────────────┬────────────┘         └────────────────────────┘
                                               │
                                               ▼
                                  ┌─────────────────────────┐
                                  │   Neon PostgreSQL DB    │
                                  │   (Neon Cloud Instance) │
                                  └─────────────────────────┘`}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-2">Ingestion Endpoint Schema</h3>
          <p className="text-xs text-slate-500 mb-3">Multipart file upload forwarding payload structure.</p>
          <div className="p-4 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-400 border border-white/5 leading-relaxed">
            <p className="text-blue-400 font-bold mb-1">POST https://sleekops-data-engine.onrender.com/api/process-manifest</p>
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
  const [token, setToken] = useState<string | null>(localStorage.getItem('sleekops_token'))
  const [user, setUser] = useState<any>(null)

  // Hydrate persistent layout profiles on component execution checks
  useEffect(() => {
    const savedUser = localStorage.getItem('sleekops_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error('Failed parsing profile profile cache bounds:', e)
      }
    }
  }, [])

  const handleAuthSuccess = (newToken: string, userProfile: any) => {
    localStorage.setItem('sleekops_token', newToken)
    localStorage.setItem('sleekops_user', JSON.stringify(userProfile))
    setToken(newToken)
    setUser(userProfile)
  };

  const handleLogout = () => {
    localStorage.removeItem('sleekops_token')
    localStorage.removeItem('sleekops_user')
    setToken(null)
    setUser(null)
  };

  // 🛡️ Lock down layout: Render Login screen if no valid session token exists
  if (!token) {
    return <Login onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className="flex h-screen bg-[#090A0F] overflow-hidden text-[#F3F4F6]">
      {/* Pass session states to sidebar to display user identities and logout flags cleanly */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        user={user} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 overflow-y-auto bg-[#090A0F]">
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