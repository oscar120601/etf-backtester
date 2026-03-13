export interface ETF {
  id: number
  symbol: string
  name: string
  name_zh?: string
  issuer: string
  asset_class: string
  asset_subclass?: string
  factor_type?: string
  region?: string
  sector?: string
  expense_ratio: number
  inception_date: string
  exchange: string
  currency: string
  is_active: boolean
  is_recommended: boolean
  min_data_year?: number
  liquidity_score?: number
  risk_level?: number
  tags?: string[]
  description?: string
  aum?: number
  tracking_index_name?: string
  tracking_index_symbol?: string
  created_at: string
  updated_at: string
}

export interface ETFListResponse {
  items: ETF[]
  total: number
  page: number
  limit: number
}

export interface ETFPrice {
  symbol: string
  date: string
  open_price?: number
  high_price?: number
  low_price?: number
  close_price?: number
  adjusted_close: number
  volume?: number
  dividend: number
}

export interface ETFPriceHistory {
  symbol: string
  currency: string
  frequency: string
  start_date: string
  end_date: string
  prices: ETFPrice[]
}
