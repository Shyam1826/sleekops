export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string
          name: string
          tier: number
          country: string
          region: string
          hub_code: string
          reliability_score: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['vendors']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['vendors']['Insert']>
      }
      ingestion_logs: {
        Row: {
          id: string
          filename: string
          file_size_bytes: number
          status: 'queued' | 'processing' | 'success' | 'failed'
          rows_total: number
          rows_repaired: number
          reconstruction_confidence: number
          error_message: string | null
          uploaded_at: string
          processed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['ingestion_logs']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['ingestion_logs']['Insert']>
      }
      reconstructed_shipments: {
        Row: {
          id: string
          shipment_id: string
          vendor_id: string
          ingestion_log_id: string
          material_type: string
          origin_hub: string
          destination_hub: string
          original_structure_status: 'clean' | 'repaired' | 'partial' | 'critical'
          imputed_fields: string[]
          predicted_delay_risk: number
          predicted_delay_hours: number
          primary_delay_driver: string
          freight_cost_usd: number
          departure_date: string
          eta: string
          status: 'on_time' | 'minor_delay' | 'high_delay'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reconstructed_shipments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reconstructed_shipments']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
