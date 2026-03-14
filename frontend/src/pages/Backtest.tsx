import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import TemplateSelector from '../components/TemplateSelector';
import SaveBacktestDialog from '../components/SaveBacktestDialog';
import BacktestCharts from '../components/BacktestCharts';
import ExportReport from '../components/ExportReport';
import SavedPortfoliosManager from '../components/SavedPortfoliosManager';
import DrawdownAnalysis from '../components/DrawdownAnalysis';
import { PortfolioTemplate } from '../data/portfolioTemplates';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { etfAPI, backtestAPI } from '../services/api';
import type { ETF, BacktestRequest, BacktestResponse } from '../types';

// 註冊 Chart.js 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// 引入 chart 配置（註冊 zoom 插件）
import '../utils/chartConfig';

interface PortfolioHolding {
  symbol: string;
  weight: number;
}

const REBALANCE_OPTIONS = [
  { value: 'none', label: '不再平衡' },
  { value: 'monthly', label: '每月再平衡' },
  { value: 'quarterly', label: '每季再平衡' },
  { value: 'annual', label: '每年再平衡' },
];

const Backtest: React.FC = () => {
  // 狀態
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([
    { symbol: '', weight: 0.6 },
    { symbol: '', weight: 0.4 },
  ]);
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [initialAmount, setInitialAmount] = useState(10000);
  const [rebalanceFreq, setRebalanceFreq] = useState('annual');
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [benchmark, setBenchmark] = useState('SPY');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BacktestResponse | null>(null);

  // 圖表引用（用於 PDF 匯出）
  const chartRef = useRef<HTMLDivElement>(null);

  // 載入 ETF 列表
  useEffect(() => {
    const loadETFs = async () => {
      try {
        const data = await etfAPI.getAll();
        setEtfs(data);
      } catch (err) {
        console.error('Failed to load ETFs:', err);
      }
    };
    loadETFs();
  }, []);

  // 處理持倉變更
  const handleHoldingChange = (index: number, field: keyof PortfolioHolding, value: string | number) => {
    const newHoldings = [...holdings];
    newHoldings[index] = { ...newHoldings[index], [field]: value };
    setHoldings(newHoldings);
  };

  // 新增持倉
  const addHolding = () => {
    if (holdings.length < 10) {
      setHoldings([...holdings, { symbol: '', weight: 0 }]);
    }
  };

  // 刪除持倉
  const removeHolding = (index: number) => {
    if (holdings.length > 1) {
      setHoldings(holdings.filter((_, i) => i !== index));
    }
  };

  // 計算總權重
  const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);

  // 執行回測
  const runBacktest = async () => {
    // 驗證
    if (Math.abs(totalWeight - 1) > 0.001) {
      setError(`權重總和必須為 100%，目前為 ${(totalWeight * 100).toFixed(1)}%`);
      return;
    }

    const emptyHoldings = holdings.filter(h => !h.symbol);
    if (emptyHoldings.length > 0) {
      setError('請為所有持倉選擇 ETF');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: BacktestRequest = {
        portfolio: holdings.map(h => ({
          symbol: h.symbol,
          weight: h.weight,
        })),
        parameters: {
          start_date: startDate,
          end_date: endDate,
          initial_amount: initialAmount,
          rebalance_frequency: rebalanceFreq,
          monthly_contribution: monthlyContribution || undefined,
          reinvest_dividends: true,
        },
        benchmark: benchmark || undefined,
      };

      const response = await backtestAPI.run(request);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || '回測執行失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 準備圖表數據
  const chartData = result
    ? {
        labels: result.time_series.portfolio_value.map(p => p.date),
        datasets: [
          {
            label: '投資組合',
            data: result.time_series.portfolio_value.map(p => p.value),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.1,
          },
          ...(result.time_series.benchmark_value
            ? [
                {
                  label: `基準 (${result.benchmark_comparison?.symbol})`,
                  data: result.time_series.benchmark_value.map(p => p.value),
                  borderColor: 'rgb(255, 99, 132)',
                  backgroundColor: 'rgba(255, 99, 132, 0.1)',
                  tension: 0.1,
                  borderDash: [5, 5] as number[],
                },
              ]
            : []),
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '投資組合價值走勢',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: string | number) => `$${Number(value).toLocaleString()}`,
        },
      },
    },
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        投資組合回測
      </Typography>

      <Grid container spacing={3}>
        {/* 左側：配置表單 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                回測設定
              </Typography>

              {/* 投資組合配置 */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
                <Typography variant="subtitle2">
                  投資組合配置
                </Typography>
                <TemplateSelector
                  onSelect={(template: PortfolioTemplate) => {
                    console.log('Applying template:', template);
                    const newHoldings = template.holdings.map(h => ({ 
                      symbol: h.symbol, 
                      weight: h.weight 
                    }));
                    console.log('New holdings:', newHoldings);
                    setHoldings(newHoldings);
                  }}
                  disabled={loading}
                />
              </Box>
              
              {holdings.map((holding, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>ETF</InputLabel>
                    <Select
                      value={holding.symbol}
                      label="ETF"
                      onChange={(e) => handleHoldingChange(index, 'symbol', e.target.value)}
                    >
                      {etfs.map((etf) => (
                        <MenuItem key={etf.symbol} value={etf.symbol}>
                          {etf.symbol} - {etf.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    type="number"
                    label="權重 %"
                    value={(holding.weight * 100).toFixed(0)}
                    onChange={(e) => handleHoldingChange(index, 'weight', Number(e.target.value) / 100)}
                    sx={{ width: 80 }}
                    inputProps={{ min: 0, max: 100, step: 5 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => removeHolding(index)}
                    disabled={holdings.length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}

              <Button
                startIcon={<AddIcon />}
                onClick={addHolding}
                disabled={holdings.length >= 10}
                size="small"
                sx={{ mb: 2 }}
              >
                新增持倉
              </Button>

              {/* 權重總和顯示 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color={Math.abs(totalWeight - 1) < 0.001 ? 'success.main' : 'error.main'}>
                  總權重: {(totalWeight * 100).toFixed(1)}%
                </Typography>
              </Box>

              {/* 投資組合管理 */}
              <Box sx={{ mb: 2 }}>
                <SavedPortfoliosManager
                  currentHoldings={holdings}
                  onLoadPortfolio={(loadedHoldings) => {
                    setHoldings(loadedHoldings.map(h => ({ symbol: h.symbol, weight: h.weight })));
                  }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* 時間範圍 */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  type="date"
                  label="開始日期"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  type="date"
                  label="結束日期"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>

              {/* 初始金額 */}
              <TextField
                label="初始金額"
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Number(e.target.value))}
                InputProps={{ startAdornment: '$' }}
                fullWidth
                sx={{ mb: 2 }}
              />

              {/* 定期定額 */}
              <TextField
                label="每月定期投入（可選）"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                InputProps={{ startAdornment: '$' }}
                fullWidth
                sx={{ mb: 2 }}
              />

              {/* 再平衡頻率 */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>再平衡頻率</InputLabel>
                <Select
                  value={rebalanceFreq}
                  label="再平衡頻率"
                  onChange={(e) => setRebalanceFreq(e.target.value)}
                >
                  {REBALANCE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 基準比較 */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>基準比較（可選）</InputLabel>
                <Select
                  value={benchmark}
                  label="基準比較"
                  onChange={(e) => setBenchmark(e.target.value)}
                >
                  <MenuItem value="">無</MenuItem>
                  <MenuItem value="SPY">SPY (S&P 500)</MenuItem>
                  <MenuItem value="VTI">VTI (全市場)</MenuItem>
                </Select>
              </FormControl>

              {/* 錯誤訊息 */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* 執行按鈕 */}
              <Button
                variant="contained"
                fullWidth
                onClick={runBacktest}
                disabled={loading}
                startIcon={loading && <CircularProgress size={16} />}
              >
                {loading ? '執行中...' : '執行回測'}
              </Button>

              {/* 儲存按鈕 */}
              {result && (
                <Box sx={{ mt: 2 }}>
                  <SaveBacktestDialog
                    portfolio={holdings.filter(h => h.symbol).map(h => ({
                      symbol: h.symbol,
                      weight: h.weight,
                    }))}
                    parameters={{
                      start_date: startDate,
                      end_date: endDate,
                      initial_amount: initialAmount,
                      rebalance_frequency: rebalanceFreq,
                      monthly_contribution: monthlyContribution || undefined,
                      reinvest_dividends: true,
                    }}
                    result={result}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 右側：結果展示 */}
        <Grid item xs={12} md={8}>
          {result ? (
            <>
              {/* 績效摘要 */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    績效摘要
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        總報酬率
                      </Typography>
                      <Typography variant="h5" color={result.metrics.total_return >= 0 ? 'success.main' : 'error.main'}>
                        {(result.metrics.total_return * 100).toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        年化報酬率 (CAGR)
                      </Typography>
                      <Typography variant="h5" color={result.metrics.cagr >= 0 ? 'success.main' : 'error.main'}>
                        {(result.metrics.cagr * 100).toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        最大回撤
                      </Typography>
                      <Typography variant="h5" color="error.main">
                        {(result.metrics.max_drawdown * 100).toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        夏普比率
                      </Typography>
                      <Typography variant="h5">
                        {result.metrics.sharpe_ratio.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={`期初: $${result.summary.initial_value.toLocaleString()}`}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={`期末: $${Math.round(result.summary.final_value).toLocaleString()}`}
                      color="primary"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* 圖表 */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      投資組合價值走勢
                    </Typography>
                    <ExportReport result={result} chartRef={chartRef} />
                  </Box>
                  <Box ref={chartRef}>
                    {chartData && <Line data={chartData} options={chartOptions} />}
                  </Box>
                </CardContent>
              </Card>

              {/* 詳細指標 */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    詳細績效指標
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        波動率（年化）
                      </Typography>
                      <Typography variant="body1">
                        {(result.metrics.volatility * 100).toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        索丁諾比率
                      </Typography>
                      <Typography variant="body1">
                        {result.metrics.sortino_ratio.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        卡瑪比率
                      </Typography>
                      <Typography variant="body1">
                        {result.metrics.calmar_ratio.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        最佳年度
                      </Typography>
                      <Typography variant="body1" color="success.main">
                        {(result.metrics.best_year * 100).toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        最差年度
                      </Typography>
                      <Typography variant="body1" color="error.main">
                        {(result.metrics.worst_year * 100).toFixed(2)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        正報酬年數
                      </Typography>
                      <Typography variant="body1">
                        {result.metrics.positive_years} / {result.metrics.positive_years + result.metrics.negative_years}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 回撤分析 */}
              <Box sx={{ mb: 3 }}>
                <DrawdownAnalysis result={result} />
              </Box>

              {/* 圖表分析 */}
              <BacktestCharts result={result} />
            </>
          ) : (
            <Card sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="text.secondary">
                設定投資組合並點擊「執行回測」查看結果
              </Typography>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Backtest;
