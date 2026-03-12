import axios from 'axios';
import type {
  ETF,
  ETFPrice,
  BacktestRequest,
  BacktestResponse,
  MonteCarloRequest,
  MonteCarloResponse,
} from '../types';

// 建立 axios 實例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// ETF API
export const etfAPI = {
  getAll: async (): Promise<ETF[]> => {
    const response = await api.get('/etfs/');
    // 後端返回 { items: [...], total, page, limit }
    return response.data.items || response.data;
  },

  getBySymbol: async (symbol: string): Promise<ETF> => {
    const response = await api.get(`/etfs/${symbol}`);
    return response.data;
  },

  getPrices: async (symbol: string, startDate?: string, endDate?: string): Promise<ETFPrice[]> => {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    const response = await api.get(`/etfs/${symbol}/prices`, { params });
    return response.data;
  },

  search: async (query: string): Promise<ETF[]> => {
    const response = await api.get('/etfs/', { params: { search: query } });
    return response.data.items || response.data;
  },
};

// 回測 API
export const backtestAPI = {
  run: async (request: BacktestRequest): Promise<BacktestResponse> => {
    const response = await api.post('/backtest/run', request);
    return response.data;
  },

  runMonteCarlo: async (request: MonteCarloRequest): Promise<MonteCarloResponse> => {
    const response = await api.post('/backtest/monte-carlo', request);
    return response.data;
  },

  getSupportedETFs: async (assetClass?: string): Promise<{ etfs: ETF[]; total: number; asset_classes: string[] }> => {
    const params: Record<string, string> = {};
    if (assetClass) params.asset_class = assetClass;
    
    const response = await api.get('/backtest/supported-etfs', { params });
    return response.data;
  },
};

export default api;
