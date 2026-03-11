import axios from 'axios'
import { ETFListResponse, ETFPriceHistory } from '../types/etf'

const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ETF API
export const etfApi = {
  getETFs: async (params?: {
    asset_class?: string
    region?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ data: ETFListResponse }> => {
    const response = await api.get('/etfs', { params })
    return response.data
  },

  getETF: async (symbol: string) => {
    const response = await api.get(`/etfs/${symbol}`)
    return response.data
  },

  getETFPrices: async (
    symbol: string,
    params?: {
      start_date?: string
      end_date?: string
      frequency?: string
    }
  ): Promise<{ data: ETFPriceHistory }> => {
    const response = await api.get(`/etfs/${symbol}/prices`, { params })
    return response.data
  },

  getFilterOptions: async (): Promise<{
    data: { asset_classes: string[]; regions: string[] }
  }> => {
    const response = await api.get('/etfs/filters/options')
    return response.data
  },
}

export default api
