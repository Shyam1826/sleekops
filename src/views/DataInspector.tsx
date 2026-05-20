import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Download,
  ChevronUp,
  ChevronDown,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type SortDir = 'asc' | 'desc'

const structureColors = {
  clean: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  repaired: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  partial: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
}

const structureIcons = {
  clean: CheckCircle2,
  repaired: AlertTriangle,
  partial: AlertTriangle,
  critical: XCircle,
}

function RiskBar({ value }: { value: number }) {
  // SQLite saves delay hours directly. Let's scale or normalize it nicely for display
  const pct = Math.min(100, Math.max(0, Math.round(value * 4))) 
  const color = pct >= 75 ? 'bg-red-500' : pct >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
  
  let displayValue = `${value} hrs`
  if (value > 24) {
    const days = Math.floor(value / 24)
    const hours = Math.round(value % 24)
    displayValue = `${days}d ${hours}h`
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono font-medium ${pct >= 75 ? 'text-red-400' : pct >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
        {displayValue}
      </span>
    </div>
  )
}

function ImputedFieldsBadge({ fields }: { fields: string[] }) {
  if (!fields.length) return <span className="text-xs text-slate-600 italic">none</span>
  return (
    <div className="flex flex-wrap gap-1">
      {fields.slice(0, 2).map((f) => (
        <span key={f} className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/15">
          {f}
        </span>
      ))}
      {fields.length > 2 && (
        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-700/60 text-slate-400">
          +{fields.length - 2}
        </span>
      )}
    </div>
  )
}

const formatKey = (key: string) => {
  if (key === 'shipment_id') return 'Shipment ID'
  if (key === 'external_id') return 'Tracking ID'
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/_|\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function renderCell(key: string, value: any) {
  if (value === null || value === undefined || value === '' || value === '—') {
    return <span className="text-slate-500 font-mono text-xs italic bg-slate-800/30 px-1.5 py-0.5 rounded">Not Provided</span>
  }
  if (key === 'status' || key === 'Status') {
    const s = String(value).toLowerCase();
    
    // ✅ SAFE MAPPING: Translate database status tokens to what StatusBadge expects
    let mappedStatus: 'success' | 'processing' | 'failed' | 'queued' = 'processing';
    
    if (s === 'delivered' || s === 'on_time' || s === 'success') {
      mappedStatus = 'success';
    } else if (s === 'delayed' || s === 'high_delay' || s === 'failed') {
      mappedStatus = 'failed';
    } else if (s === 'in_transit' || s === 'minor_delay' || s === 'processing') {
      mappedStatus = 'processing';
    } else {
      mappedStatus = 'queued';
    }

    return <StatusBadge status={mappedStatus} />
  }
  
  if (key === 'predicted_delay_hours' || key === 'predicted_delay_risk') {
    return <RiskBar value={Number(value)} />
  }
  
  if (key === 'imputed_fields') {
    let fields = value
    if (typeof value === 'string') {
      try { fields = JSON.parse(value) } catch { fields = [] }
    }
    return <ImputedFieldsBadge fields={Array.isArray(fields) ? fields : []} />
  }

  if (typeof value === 'number') {
    return <span className="text-sm text-slate-300 font-mono">{value.toLocaleString()}</span>
  }

  return <span className="text-sm text-slate-200">{String(value)}</span>
}
function DetailDrawer({ shipment, onClose }: { shipment: Record<string, any>; onClose: () => void }) {
  const displayId = shipment.shipment_id || shipment.id || 'Details'
  
  // Filter out internal operational tokens from details list display
  const cleanEntries = Object.entries(shipment).filter(([k]) => !['vendor_id', 'ingestion_log_id'].includes(k));

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-slate-900 border-l border-slate-800/60 shadow-2xl z-50 flex flex-col animate-slide-in">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
        <div>
          <p className="text-xs text-slate-500 font-mono mb-0.5">Shipment Detail</p>
          <h3 className="text-sm font-bold text-white font-mono">{displayId}</h3>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {cleanEntries.map(([key, value]) => (
          <div key={key}>
            <p className="text-xs text-slate-500 font-semibold mb-1">{formatKey(key)}</p>
            <div className="text-sm text-slate-200 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30 break-all">
              {renderCell(key, value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DataInspector() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<string>('')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<Record<string, any> | null>(null)
  const [shipments, setShipments] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/shipments`)
      .then(res => {
        if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
        return res.json();
      })
      .then(payload => {
        const response = { data: payload };
        console.log("[Data Inspector Debug] Raw API Payload Root:", response.data);
        const incomingRecords = response.data.data || response.data.shipments || response.data;
        setShipments(Array.isArray(incomingRecords) ? incomingRecords : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('[Frontend Fetch Error]:', err);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: number | string) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this shipment?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/shipments/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`Failed to delete shipment: ${res.statusText}`);
      
      // Update state to remove the deleted shipment immediately without reload
      setShipments((prev) => prev.filter((s) => s.id !== id));
      if (selected?.id === id) {
        setSelected(null);
      }
    } catch (err) {
      console.error('[Delete Error]:', err);
      alert('Error deleting shipment.');
    }
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

const filtered = shipments
    .filter((s) => {
      const q = search.toLowerCase()
      let matchSearch = !q
      if (q) {
        matchSearch = Object.values(s).some(val => 
          String(val ?? '').toLowerCase().includes(q)
        )
      }
      
      const hours = Number(s.predicted_delay_hours || 0);
      const rawStatus = String(s.status || s.Status || '').toLowerCase();

      // ✅ RE-ALIGNED: Filter strictly by hourly brackets so leaks are impossible
      let matchStatus = false;
      if (statusFilter === 'all') {
        matchStatus = true;
      } else if (statusFilter === 'on_time') {
        // Safe Window: Under 3 hours of delay
        matchStatus = (hours <= 3 && rawStatus !== 'failed');
      } else if (statusFilter === 'minor_delay') {
        // Minor Delay Window: Between 3 and 12 hours
        matchStatus = (hours > 3 && hours <= 12);
      } else if (statusFilter === 'high_delay') {
        // High Risk Window: Anything exceeding 12 hours or hard-failed
        matchStatus = (hours > 12 || rawStatus === 'failed' || rawStatus === 'high_delay');
      }
      
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      if (!sortKey) return 0
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av === bv) return 0
      const cmp = av < bv ? -1 : 1
      return sortDir === 'asc' ? cmp : -cmp
    })

  const SortIcon = ({ k }: { k: string }) => {
    if (sortKey !== k) return <div className="w-3.5 h-3.5 text-slate-700"><ChevronUp className="w-3.5 h-3.5" /></div>
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
      : <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
  }

  // ✅ FIXED: Whitelist clean columns explicitly to stop technical variables from clumping cells
  const columns = ['shipment_id', 'origin_hub', 'destination_hub', 'material_type', 'weight_kg', 'predicted_delay_hours', 'status', 'vendor_name', 'external_id'];

  return (
    <div className="p-8 animate-fade-in">
      <PageHeader
        title="Data Inspector & Diff Grid"
        subtitle="Dynamic schema-agnostic record viewer with ML annotations"
      >
        <button className="btn-secondary text-xs">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search across all columns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900/60 border border-slate-700/60 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:bg-slate-900"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/60 rounded-lg p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'on_time', label: 'On Time' },
            { key: 'minor_delay', label: 'Minor Delay' },
            { key: 'high_delay', label: 'High Risk' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          {filtered.length} records
        </div>

        <div className="ml-auto flex items-center gap-1.5 badge-blue text-xs">
          <Info className="w-3 h-3" />
          Dynamic grid adapts to uploaded columns
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-900/40">
                {columns.map((key) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-slate-400 uppercase whitespace-nowrap cursor-pointer hover:text-slate-200 transition-colors select-none group"
                    onClick={() => toggleSort(key)}
                  >
                    <div className="flex items-center gap-1">
                      {formatKey(key)}
                      <SortIcon k={key} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-slate-400 uppercase whitespace-nowrap select-none w-10">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-16 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Loading dataset...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-16 text-center">
                    <p className="text-slate-500 text-sm">No records to display.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr
                    key={s.id || idx}
                    className={`group transition-colors cursor-pointer
                      ${selected?.id === s.id ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : 'hover:bg-slate-800/30'}
                    `}
                    onClick={() => setSelected(s)}
                  >
                    {columns.map(key => (
                      <td key={key} className="px-4 py-3 whitespace-nowrap">
                        {key === 'weight_kg' ? (
                          <span className="text-sm text-slate-300 font-mono">{s[key]?.toLocaleString()} kg</span>
                        ) : key === 'external_id' ? (
                          <span className="text-xs text-slate-500 font-mono">{String(s[key] || '').substring(0, 14)}...</span>
                        ) : (
                          renderCell(key, s[key])
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 whitespace-nowrap text-left" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelected(null)} />
          <div className="relative z-50">
            <DetailDrawer shipment={selected} onClose={() => setSelected(null)} />
          </div>
        </>
      )}
    </div>
  )
}