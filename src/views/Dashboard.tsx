import {
  Package,
  Wrench,
  ShieldCheck,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'
import type { IngestionLog, KPIData, FeatureImportance, IngestionMetricPoint } from '../types'
import { useState, useEffect } from 'react'

function formatBytes(bytes: number): string {
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  return `${(bytes / 1_000).toFixed(0)} KB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const categoryColors: Record<string, string> = {
  vendor: '#3b82f6',
  location: '#06b6d4',
  environmental: '#10b981',
  structural: '#f59e0b',
  temporal: '#8b5cf6',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1.5 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="text-white font-medium">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

const FeatureTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="glass-card rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-medium mb-1">{d.feature}</p>
      <p className="text-slate-400">Importance: <span className="text-blue-400 font-semibold">{(d.importance * 100).toFixed(1)}%</span></p>
      <p className="text-slate-500 capitalize mt-0.5">Category: {d.category}</p>
    </div>
  )
}

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  trend: 'up' | 'down' | 'neutral'
  color: 'blue' | 'green' | 'amber' | 'red'
}) {
  const colorMap = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', glow: 'shadow-blue-500/5' },
    green: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', glow: 'shadow-emerald-500/5' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400', glow: 'shadow-amber-500/5' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-400', glow: 'shadow-red-500/5' },
  }
  const c = colorMap[color]

  return (
    <div className={`glass-card-hover rounded-xl p-5 shadow-lg ${c.glow}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${c.bg} border ${c.border}`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
        {trend !== 'neutral' && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trend === 'up' ? '+4.2%' : '-1.8%'}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-sm font-medium text-slate-300 mt-1">{label}</p>
      <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
    </div>
  )
}

function RecentUploadsRow({ log }: { log: IngestionLog }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-800/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate font-mono">{log.filename}</p>
        <p className="text-xs text-slate-500 mt-0.5">{formatDate(log.uploadedAt)} · {formatBytes(log.fileSizeBytes)}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {log.status === 'success' && (
          <span className="text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">{log.rowsRepaired.toLocaleString()}</span> repaired
          </span>
        )}
        {log.status === 'success' && (
          <span className="text-xs text-slate-400">
            <span className="text-blue-400 font-semibold">{log.reconstructionConfidence}%</span> conf.
          </span>
        )}
        <StatusBadge status={log.status} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [kpi, setKpi] = useState<KPIData | null>(null)
  const [metrics, setMetrics] = useState<IngestionMetricPoint[]>([])
  const [features, setFeatures] = useState<FeatureImportance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3001/api/analytics/kpi').then(r => r.json()),
      fetch('http://localhost:3001/api/analytics/ingestion-metrics').then(r => r.json()),
      fetch('http://localhost:3001/api/analytics/risk-factors').then(r => r.json())
    ])
      .then(([kpiData, metricsData, riskData]) => {
        setKpi(kpiData)
        setMetrics(metricsData)
        setFeatures(riskData.features || [])
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const featureData = features.map((f) => ({
    ...f,
    label: f.feature.length > 28 ? f.feature.slice(0, 28) + '…' : f.feature,
    pct: +(f.importance * 100).toFixed(1),
  }))

  if (loading || !kpi) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 animate-fade-in">
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time overview of your adaptive logistics reconstruction pipeline"
      >
        <button className="btn-secondary text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          Last sync: 2 min ago
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KPICard
          icon={Package}
          label="Total Shipments Ingested"
          value={(kpi?.totalShipments || 0).toLocaleString()}
          sub="Across all active vendors"
          trend="up"
          color="blue"
        />
        <KPICard
          icon={Wrench}
          label="Anomalies Auto-Repaired"
          value={(kpi?.anomaliesRepaired || 0).toLocaleString()}
          sub="Via adaptive reconstruction"
          trend="up"
          color="green"
        />
        <KPICard
          icon={ShieldCheck}
          label="Avg Reconstruction Confidence"
          value={`${kpi?.avgConfidence || 0}%`}
          sub="XGBoost inference quality"
          trend="neutral"
          color="amber"
        />
        <KPICard
          icon={AlertOctagon}
          label="At-Risk Delayed Deliveries"
          value={(kpi?.atRiskDeliveries || 0).toString()}
          sub="Predicted delay > 12 hrs"
          trend="down"
          color="red"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
        {/* Ingestion Metrics */}
        <div className="xl:col-span-3 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Ingestion Metrics Over Time</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daily pipeline throughput and repair activity</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500/60 border border-blue-500" />Ingested</span>
              <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500" />Repaired</span>
              <span className="flex items-center gap-1.5 text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/40 border border-red-500" />Failed</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={metrics || []} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradIngested" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRepaired" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.2)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ingested" name="Ingested" stroke="#3b82f6" strokeWidth={2} fill="url(#gradIngested)" dot={false} />
              <Area type="monotone" dataKey="repaired" name="Repaired" stroke="#10b981" strokeWidth={2} fill="url(#gradRepaired)" dot={false} />
              <Area type="monotone" dataKey="failed" name="Failed" stroke="#ef4444" strokeWidth={1.5} fill="none" dot={false} strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Importance */}
        <div className="xl:col-span-2 glass-card rounded-xl p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-white">XGBoost Feature Importance</h3>
            <p className="text-xs text-slate-500 mt-0.5">Primary delay risk drivers</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={featureData || []} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.15)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
              <Tooltip content={<FeatureTooltip />} />
              <Bar dataKey="pct" radius={[0, 3, 3, 0]}>
                {featureData.map((entry) => (
                  <Cell key={entry.feature} fill={categoryColors[entry.category] ?? '#3b82f6'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(categoryColors).map(([cat, color]) => (
              <span key={cat} className="flex items-center gap-1.5 text-[10px] text-slate-400 capitalize">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />{cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Uploads (Removed as no API available) */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent File Uploads</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live ingestion pipeline status</p>
          </div>
          <button className="btn-secondary text-xs py-1.5">View All</button>
        </div>
        <div className="py-8 text-center text-slate-500 text-sm">
          No recent uploads to display.
        </div>
      </div>
    </div>
  )
}
