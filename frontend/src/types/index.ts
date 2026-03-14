// ETF 類型 - 從 etf.ts 重新導出
export type { ETF, ETFPrice, ETFListResponse, ETFPriceHistory } from './etf';

// 回測請求
export interface PortfolioHolding {
  symbol: string;
  weight: number;
}

export interface BacktestParameters {
  start_date: string;
  end_date: string;
  initial_amount: number;
  rebalance_frequency: string;
  monthly_contribution?: number;
  reinvest_dividends: boolean;
  benchmark?: string;
}

export interface BacktestRequest {
  portfolio: PortfolioHolding[];
  parameters: BacktestParameters;
  benchmark?: string;
}

// 績效指標
export interface PerformanceMetrics {
  total_return: number;
  cagr: number;
  volatility: number;
  max_drawdown: number;
  max_drawdown_duration: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  best_year: number;
  worst_year: number;
  positive_years: number;
  negative_years: number;
  avg_up_month: number;
  avg_down_month: number;
  var_95: number;
  cvar_95: number;
}

// 時間序列點
export interface TimeSeriesPoint {
  date: string;
  value: number;
}

// 回測響應
export interface BacktestSummary {
  initial_value: number;
  final_value: number;
  total_return: number;
  cagr: number;
  sharpe_ratio: number;
}

export interface BenchmarkComparison {
  symbol: string;
  metrics: PerformanceMetrics;
  time_series: TimeSeriesPoint[];
  excess_return: number;
  tracking_error: number;
}

export interface BacktestResponse {
  backtest_id: string;
  portfolio: PortfolioHolding[];
  parameters: BacktestParameters;
  summary: BacktestSummary;
  metrics: PerformanceMetrics;
  time_series: {
    portfolio_value: TimeSeriesPoint[];
    drawdown: TimeSeriesPoint[];
    benchmark_value?: TimeSeriesPoint[];
    annual_returns?: Array<{ year: number; return: number }>;
  };
  benchmark_comparison?: BenchmarkComparison;
  generated_at: string;
  execution_time_ms: number;
}

// 蒙地卡羅模擬
export interface MonteCarloRequest {
  portfolio: PortfolioHolding[];
  years: number;
  initial_amount: number;
  monthly_contribution: number;
  simulations: number;
  confidence_levels: number[];
  target_amount?: number;
}

export interface MonteCarloResponse {
  simulations: number;
  years: number;
  percentiles: Record<string, Record<string, number>>;
  paths: Array<{
    percentile: string;
    values: number[];
  }>;
  success_probability: Record<string, number>;
}

// 已儲存回測
export interface SavedBacktest {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  total_return?: number;
  cagr?: number;
  max_drawdown?: number;
  sharpe_ratio?: number;
  created_at: string;
  portfolio?: PortfolioHolding[];
  parameters?: BacktestParameters;
  result?: BacktestResponse;
}

export interface SavedBacktestCreate {
  name: string;
  description?: string;
  session_id?: string;
  portfolio: PortfolioHolding[];
  parameters: BacktestParameters;
  result?: BacktestResponse;
}

// ============================================
// 投資組合優化相關類型
// ============================================

export interface WeightConstraints {
  min: number;
  max: number;
}

export interface OptimizationRequest {
  symbols: string[];
  objective: 'max_sharpe' | 'min_volatility' | 'target_return';
  target_return?: number;
  risk_free_rate: number;
  weight_constraints: WeightConstraints;
  lookback_years: number;
}

export interface OptimizedPortfolio {
  name: string;
  description: string;
  objective: string;
  weights: Record<string, number>;
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
}

export interface EfficientFrontierPoint {
  volatility: number;
  expected_return: number;
  sharpe_ratio: number;
}

export interface IndividualAsset {
  symbol: string;
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
}

export interface OptimizationMetadata {
  risk_free_rate: number;
  symbols: string[];
  lookback_period: string;
  optimization_method: string;
}

export interface OptimizationResponse {
  optimization_id: string;
  recommended_portfolios: Record<string, OptimizedPortfolio>;
  efficient_frontier: EfficientFrontierPoint[];
  individual_assets: IndividualAsset[];
  metadata: OptimizationMetadata;
  generated_at: string;
  execution_time_ms: number;
}

export interface OptimizationObjective {
  id: string;
  name: string;
  description: string;
  recommended_for: string;
  risk_profile: string;
}
