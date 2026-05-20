import { useState, useEffect } from 'react'
import {
  MapPin,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Package,
  Clock,
  DollarSign,
  Loader2,
} from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import PageHeader from '../components/ui/PageHeader'
import StatusBadge from '../components/ui/StatusBadge'
import { mockHubs } from '../data/mockData'
import type { ShippingRoute, LogisticsHub } from '../types'

// 🚨 CRITICAL: Include Leaflet's core styles or the map structure breaks!
import 'leaflet/dist/leaflet.css'

const routeColors = {
  on_time: '#10b981',
  minor_delay: '#f59e0b',
  high_delay: '#ef4444',
}

const hubTypeColors = {
  supplier: '#3b82f6',
  distribution: '#06b6d4',
  factory: '#8b5cf6',
}

// Custom Leaflet Circle Marker Generator to prevent default blue icon loading errors
const createCustomMarker = (color: string) => {
  return L.divIcon({
    html: `<div style="position: relative;">
            <div style="position: absolute; top: -6px; left: -6px; width: 12px; height: 12px; background-color: ${color}; border: 2px solid #0f172a; border-radius: 50%;"></div>
            <div style="position: absolute; top: -10px; left: -10px; width: 20px; height: 20px; border: 2px solid ${color}; border-radius: 50%; opacity: 0.4; animation: pulse 2s infinite;"></div>
           </div>`,
    className: 'custom-gps-node',
  })
}

function RouteListItem({
  route,
  selected,
  onClick,
}: {
  route: ShippingRoute
  selected: boolean
  onClick: () => void
}) {
  const color = routeColors[route.status as keyof typeof routeColors] || '#10b981'
  const StatusIcon = route.status === 'on_time' ? CheckCircle2 : route.status === 'minor_delay' ? AlertTriangle : XCircle
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-slate-800/40 transition-all duration-150
        ${selected ? 'bg-blue-500/8 border-l-2 border-l-blue-500' : 'hover:bg-slate-800/30'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <StatusIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
        <span className="text-[11px] font-mono text-slate-300">{route.shipmentId}</span>
        <StatusBadge status={route.status} />
      </div>
      <p className="text-xs font-medium text-slate-300 truncate">{route.vendorName}</p>
      <p className="text-[10px] text-slate-600 font-mono mt-0.5">{route.fromHub} → {route.toHub}</p>
    </button>
  )
}

function RouteDrawer({ route, onClose }: { route: ShippingRoute; onClose: () => void }) {
  const color = routeColors[route.status as keyof typeof routeColors] || '#10b981'
  return (
    <div className="absolute top-4 right-4 w-80 bg-slate-900/95 border border-slate-700/60 rounded-xl shadow-2xl backdrop-blur-sm z-[1000] animate-fade-in overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
        <div>
          <p className="text-[10px] text-slate-500 font-mono">Active Route</p>
          <h3 className="text-sm font-bold font-mono text-white">{route.shipmentId}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <StatusBadge status={route.status} />
        </div>

        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <div className="w-px h-6 bg-slate-700" />
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-mono text-slate-300">{route.fromHub}</p>
              <p className="text-[10px] text-slate-600">Active shipping lane</p>
              <p className="text-xs font-mono text-slate-300">{route.toHub}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Est. Delay</span>
            </div>
            <p className="text-sm font-bold" style={{ color: route.predictedDelayHours > 0 ? color : '#10b981' }}>
              {route.predictedDelayHours > 0 ? `${route.predictedDelayHours}h` : 'On Schedule'}
            </p>
          </div>
          <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/30">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Freight</span>
            </div>
            <p className="text-sm font-bold text-white">${(route.freightCostUsd / 1000).toFixed(0)}K</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cargo</p>
          <div className="flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-300">{route.materialType}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{route.vendorName}</p>
        </div>
      </div>
    </div>
  )
}

function ChangeMapView({ coordinates }: { coordinates: { lat: number, lng: number }[] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      const bounds = coordinates.map(c => [c.lat, c.lng] as [number, number]);
      try {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
      } catch(e) {}
    }
  }, [coordinates, map]);
  return null;
}

export default function GISView() {
  const [selectedRoute, setSelectedRoute] = useState<ShippingRoute | null>(null)
  const [listFilter, setListFilter] = useState<string>('all')
  const [routes, setRoutes] = useState<ShippingRoute[]>([])
  const [loading, setLoading] = useState(true)

  // Center around India's coordinates natively
  const mapCenter: [number, number] = [22.5937, 78.9629]

  useEffect(() => {
    setLoading(true)
    fetch('http://localhost:3001/api/shipments?limit=100')
      .then(res => res.json())
      .then(data => {
        const liveRoutes = (data.data || []).map((row: any) => {
          // Dynamic fallback to make sure every record maps to a valid hub code
          const mockCodes = mockHubs.map(h => h.code);
          const rowIdNum = parseInt(row.id, 10) || 0;
          const originIndex = rowIdNum % mockCodes.length;
          const destIndex = (rowIdNum + 2) % mockCodes.length;

          const fromHubCode = row.origin_hub || mockCodes[originIndex];
          const toHubCode = row.destination_hub || mockCodes[destIndex];

          const fromHub = mockHubs.find(h => h.code === fromHubCode) || { lat: 22.5937, lng: 78.9629 };
          const toHub = mockHubs.find(h => h.code === toHubCode) || { lat: 24.5937, lng: 80.9629 };

          const fromLat = row.origin_lat !== undefined && row.origin_lat !== null ? row.origin_lat : fromHub.lat;
          const fromLng = row.origin_lng !== undefined && row.origin_lng !== null ? row.origin_lng : fromHub.lng;
          const toLat = row.destination_lat !== undefined && row.destination_lat !== null ? row.destination_lat : toHub.lat;
          const toLng = row.destination_lng !== undefined && row.destination_lng !== null ? row.destination_lng : toHub.lng;
          
          let cleanStatus = row.status ? String(row.status).toLowerCase() : 'on_time';
          if (cleanStatus === 'processing' || cleanStatus === 'repaired' || cleanStatus === 'delivered' || cleanStatus === 'success' || cleanStatus === 'in_transit') {
            cleanStatus = 'on_time';
          } else if (cleanStatus === 'failed' || cleanStatus === 'delayed' || cleanStatus === 'high_delay') {
            cleanStatus = 'high_delay';
          } else if (cleanStatus === 'minor_delay') {
            cleanStatus = 'minor_delay';
          } else {
            cleanStatus = 'on_time';
          }

          return {
            id: String(row.id),
            fromHub: fromHubCode,
            toHub: toHubCode,
            fromLat,
            fromLng,
            toLat,
            toLng,
            status: cleanStatus,
            shipmentId: row.shipment_id || `SHP-${row.id}`,
            vendorName: row.vendor_name || 'Default Vendor',
            predictedDelayHours: row.predicted_delay_hours || 0,
            primaryDelayDriver: row.primary_delay_driver || 'None',
            freightCostUsd: row.freight_cost_usd || 4500,
            materialType: row.material_type || 'General Cargo'
          };
        }) as ShippingRoute[];
        
        setRoutes(liveRoutes)
        setLoading(false)
      })
      .catch(err => {
        console.error('[GIS Fetch Error]:', err)
        setLoading(false)
      })
  }, [])

  const filteredRoutes = listFilter === 'all'
    ? routes
    : routes.filter((r) => r.status === listFilter)

  // Extract non-empty unique coordinate pairs for bounds rendering
  const computedCoordsArray = routes
    .flatMap(r => [
      { lat: Number(r.fromLat), lng: Number(r.fromLng) },
      { lat: Number(r.toLat), lng: Number(r.toLng) }
    ])
    .filter(c => c.lat !== 0 && c.lng !== 0 && !isNaN(c.lat) && !isNaN(c.lng));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar List panel */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-slate-800/60 bg-slate-900/20">
        <div className="px-4 py-4 border-b border-slate-800/60">
          <h2 className="text-sm font-semibold text-white mb-1">Active Routes</h2>
          <p className="text-xs text-slate-500">Click a route to inspect</p>
          <div className="flex gap-1 mt-3 bg-slate-950 rounded-lg p-0.5 border border-slate-800/60">
            {[
              { key: 'all', label: 'All Lanes' },
              { key: 'high_delay', label: 'At Risk' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setListFilter(key)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  listFilter === key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/30">
          {filteredRoutes.map((route) => (
            <RouteListItem
              key={route.id}
              route={route}
              selected={selectedRoute?.id === route.id}
              onClick={() => setSelectedRoute(selectedRoute?.id === route.id ? null : route)}
            />
          ))}
          {!loading && filteredRoutes.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-600 italic">No active lanes match filter</div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>{mockHubs.length} NODES</span>
            <span>{routes.length} LANES</span>
          </div>
        </div>
      </div>

      {/* Primary Leaflet Map Container Layer Viewport */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-white">Global Logistics Network</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">Live Leaflet Map</span>
          </div>
        </div>

        <div className="flex-1 relative bg-slate-950 z-10">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
              <p className="text-slate-500 text-sm">Loading maps geometry layer...</p>
            </div>
          ) : (
            <>
              {/* ✅ LIVE REAL-MAP INJECTOR */}
              <MapContainer id="retrace-gis-engine" preferCanvas={true} trackResize={true} center={mapCenter} zoom={5} className="w-full h-full z-10" zoomControl={false}>
                <ChangeMapView coordinates={computedCoordsArray} />
                {/* Sleek dark cartographic tile sheet engine */}
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />

                {/* Draw Route Poly-lines */}
                {routes.map((route) => {
                  const isSelected = selectedRoute?.id === route.id
                  const color = routeColors[route.status as keyof typeof routeColors] || '#10b981'
                  
                  return (
                    <Polyline
                      key={route.id}
                      positions={[[route.fromLat, route.fromLng], [route.toLat, route.toLng]]}
                      pathOptions={{
                        color: color,
                        weight: isSelected ? 4 : 2,
                        opacity: isSelected ? 1 : 0.4,
                        dashArray: route.status === 'high_delay' ? '5, 5' : undefined
                      }}
                      eventHandlers={{
                        click: () => setSelectedRoute(isSelected ? null : route)
                      }}
                    />
                  )
                })}

                {/* Plot Hub Node Markers */}
                {mockHubs.map((hub) => {
                  const hubColor = hubTypeColors[hub.type as keyof typeof hubTypeColors] || '#3b82f6'
                  return (
                    <Marker
                      key={hub.id}
                      position={[hub.lat, hub.lng]}
                      icon={createCustomMarker(hubColor)}
                    >
                      <Popup>
                        <div className="text-slate-900 p-1">
                          <p className="font-bold text-xs font-mono">{hub.code}</p>
                          <p className="text-[10px] text-slate-500 capitalize">{hub.type} Node</p>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>

              {/* Drawer Summary */}
              {selectedRoute && (
                <RouteDrawer route={selectedRoute} onClose={() => setSelectedRoute(null)} />
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Dynamic Pulse Animation Style Tag injection */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 0; }
          100% { transform: scale(0.6); opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}