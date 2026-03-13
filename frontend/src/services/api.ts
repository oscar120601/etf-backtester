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
// 開發環境使用相對路徑以利用 Vite proxy，避免 CORS 問題
// 生產環境使用 VITE_API_URL 環境變數
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// ETF API
export const etfAPI = {
  getAll: async (): Promise<ETF[]> => {
    const response = await api.get('/etfs');
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
    const response = await api.get('/etfs', { params: { search: query } });
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

// 投資組合優化 API
export const optimizerAPI = {
  optimize: async (request: import('../types').OptimizationRequest): Promise<import('../types').OptimizationResponse> => {
    const response = await api.post('/optimizer/mpt', request);
    return response.data;
  },

  getEfficientFrontier: async (request: {
    symbols: string[];
    num_points?: number;
    risk_free_rate?: number;
    weight_constraints?: { min: number; max: number };
    lookback_years?: number;
  }): Promise<{
    frontier_id: string;
    points: import('../types').EfficientFrontierPoint[];
    max_sharpe_point: import('../types').EfficientFrontierPoint;
    min_volatility_point: import('../types').EfficientFrontierPoint;
    individual_assets: import('../types').IndividualAsset[];
    generated_at: string;
  }> => {
    const response = await api.post('/optimizer/efficient-frontier', {
      num_points: 50,
      ...request
    });
    return response.data;
  },

  getObjectives: async (): Promise<{
    objectives: import('../types').OptimizationObjective[];
    risk_free_rate_note: string;
    weight_constraints_note: string;
  }> => {
    const response = await api.get('/optimizer/objectives');
    return response.data;
  },
};

// 投資分析 API
export const analysisAPI = {
  getRollingReturns: async (request: {
    portfolio: Record<string, number>;
    start_date?: string;
    end_date?: string;
    window_years?: number[];
  }): Promise<{
    analysis_id: string;
    portfolio: Record<string, number>;
    periods: Record<string, {
      window_years: number;
      dates: string[];
      returns: number[];
      stats: {
        mean: number;
        median: number;
        std: number;
        min: number;
        max: number;
        percentile_5: number;
        percentile_25: number;
        percentile_75: number;
        percentile_95: number;
        positive_ratio: number;
      };
    }>;
    summary: any;
    generated_at: string;
  }> => {
    const response = await api.post('/analysis/rolling-returns', request);
    return response.data;
  },

  getCorrelationMatrix: async (params: {
    symbols: string;
    lookback_years?: number;
    method?: string;
  }): Promise<{
    analysis_id: string;
    symbols: string[];
    lookback_years: number;
    method: string;
    heatmap: {
      symbols: string[];
      data: Array<{
        x: string;
        y: string;
        value: number;
        color: string;
        level: any;
      }>;
      matrix: Record<string, Record<string, number>>;
    };
    summary: any;
    generated_at: string;
  }> => {
    const response = await api.get('/analysis/correlation-matrix', { params });
    return response.data;
  },

  getCorrelationLevels: async (): Promise<{
    levels: Array<{
      key: string;
      range: number[];
      description: string;
      color: string;
      interpretation: string;
    }>;
    interpretation_guide: Record<string, string>;
  }> => {
    const response = await api.get('/analysis/correlation-levels');
    return response.data;
  },
};

// 壓力測試 API
export const stressTestAPI = {
  getScenarios: async (): Promise<{
    scenarios: Array<{
      id: string;
      name: string;
      description: string;
      start_date: string;
      end_date: string;
      benchmark: string;
    }>;
  }> => {
    const response = await api.get('/stress-test/scenarios');
    return response.data;
  },

  runStressTest: async (request: {
    portfolio: Record<string, number>;
    scenario_id: string;
  }): Promise<any> => {
    const response = await api.post('/stress-test/run', request);
    return response.data;
  },

  runAllStressTests: async (request: {
    portfolio: Record<string, number>;
  }): Promise<any> => {
    const response = await api.post('/stress-test/run-all', request);
    return response.data;
  },

  getInflationAdjusted: async (request: {
    nominal_values: Array<{ date: string; value: number }>;
  }): Promise<any> => {
    const response = await api.post('/stress-test/inflation-adjusted', request);
    return response.data;
  },

  getPurchasingPower: async (request: {
    initial_amount: number;
    years: number;
    inflation_rate?: number;
  }): Promise<any> => {
    const response = await api.post('/stress-test/purchasing-power', request);
    return response.data;
  },

  getInflationData: async (params?: {
    start_year?: number;
    end_year?: number;
  }): Promise<any> => {
    const response = await api.get('/stress-test/inflation-data', { params });
    return response.data;
  },
};

export default api;
