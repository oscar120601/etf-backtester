// ETF 類型
export interface ETF {
  symbol: string;
  name: string;
  asset_class: string;
  expense_ratio?: number;
  description?: string;
  aum?: number;
  inception_date?: string;
}

// ETF 價格
export interface ETFPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
  dividend?: number;
}

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
