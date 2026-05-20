export type View = 'dashboard' | 'upload' | 'inspector' | 'gis' | 'alerts' | 'settings' | 'documentation'

export interface KPIData {
  totalShipments: number
  anomaliesRepaired: number
  avgConfidence: number
  atRiskDeliveries: number
}

export interface IngestionLog {
  id: string
  filename: string
  fileSizeBytes: number
  status: 'queued' | 'processing' | 'success' | 'failed'
  rowsTotal: number
  rowsRepaired: number
  reconstructionConfidence: number
  errorMessage?: string
  uploadedAt: string
  processedAt?: string
}

export interface Shipment {
  id: string
  shipmentId: string
  vendorName: string
  materialType: string
  originHub: string
  destinationHub: string
  originalStructureStatus: 'clean' | 'repaired' | 'partial' | 'critical'
  imputedFields: string[]
  predictedDelayRisk: number
  predictedDelayHours: number
  primaryDelayDriver: string
  freightCostUsd: number
  departureDate: string
  eta: string
  status: 'on_time' | 'minor_delay' | 'high_delay'
}

export interface LogisticsHub {
  id: string
  name: string
  code: string
  lat: number
  lng: number
  type: 'supplier' | 'factory' | 'distribution'
  country: string
}

export interface ShippingRoute {
  id: string
  fromHub: string
  toHub: string
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  status: 'on_time' | 'minor_delay' | 'high_delay'
  shipmentId: string
  vendorName: string
  predictedDelayHours: number
  primaryDelayDriver: string
  freightCostUsd: number
  materialType: string
}

export interface IngestionMetricPoint {
  date: string
  ingested: number
  repaired: number
  failed: number
}

export interface FeatureImportance {
  feature: string
  importance: number
  category: 'vendor' | 'location' | 'environmental' | 'structural' | 'temporal'
}

export interface PipelineStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'done' | 'error'
  duration?: number
}
