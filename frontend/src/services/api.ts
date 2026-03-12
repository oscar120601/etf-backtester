import axios from 'axios';
import type {
  ETF,
  ETFPrice,
  BacktestRequest,
  BacktestResponse,
  MonteCarloRequest,
  MonteCarloResponse,
  SavedBacktest,
  SavedBacktestCreate,
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

  comparePortfolios: async (data: {
    portfolios: Array<{
      id: string;
      name: string;
      holdings: Array<{ symbol: string; weight: number }>;
    }>;
    parameters: any;
  }): Promise<any> => {
    const response = await api.post('/backtest/compare', data);
    return response.data;
  },
};

// 已儲存回測 API
export const savedBacktestAPI = {
  getAll: async (sessionId?: string): Promise<{ items: SavedBacktest[]; total: number }> => {
    const params: Record<string, string> = {};
    if (sessionId) params.session_id = sessionId;
    
    const response = await api.get('/saved-backtests', { params });
    return response.data;
  },

  getById: async (id: number): Promise<SavedBacktest> => {
    const response = await api.get(`/saved-backtests/${id}`);
    return response.data;
  },

  create: async (data: SavedBacktestCreate): Promise<SavedBacktest> => {
    const response = await api.post('/saved-backtests', data);
    return response.data;
  },

  update: async (id: number, data: { name?: string; description?: string }): Promise<SavedBacktest> => {
    const response = await api.put(`/saved-backtests/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/saved-backtests/${id}`);
  },
};

// 資料同步 API
export const dataSyncAPI = {
  getStatus: async (): Promise<{ total_etfs: number; status: any[] }> => {
    const response = await api.get('/data-sync/price-status');
    return response.data;
  },

  updatePrices: async (symbols?: string[]): Promise<any> => {
    const params: Record<string, any> = {};
    if (symbols) params.symbols = symbols;
    
    const response = await api.post('/data-sync/update-prices', null, { params });
    return response.data;
  },

  updateSingleETF: async (symbol: string): Promise<any> => {
    const response = await api.post(`/data-sync/update-single/${symbol}`);
    return response.data;
  },
};

export default api;
