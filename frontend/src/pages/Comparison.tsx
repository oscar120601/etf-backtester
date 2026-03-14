import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  TextField,
  IconButton,
  Divider,
  Alert,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CompareArrows as CompareIcon,
  EmojiEvents as TrophyIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { etfAPI, backtestAPI, savedBacktestAPI } from '../services/api';
import ETFSelector from '../components/ETFSelector';
import LoadingOverlay from '../components/LoadingOverlay';
import { ETF } from '../types/etf';
import type { SavedBacktest } from '../types';
import { getChartOptionsWithZoom } from '../utils/chartConfig';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

interface PortfolioConfig {
  id: string;
  name: string;
  holdings: Array<{ symbol: string; weight: number }>;
}

interface ComparisonResult {
  comparison_id: string;
  portfolios: Array<{
    id: string;
    name: string;
    holdings: Array<{ symbol: string; weight: number }>;
    metrics: any;
  }>;
  comparison_table: {
    headers: string[];
    rows: Array<{
      metric: string;
      unit: string;
      [key: string]: any;
    }>;
  };
  time_series: Array<{
    date: string;
    [portfolioId: string]: any;
  }>;
  winner: {
    id: string;
    name: string;
    score: number;
    total_metrics: number;
    winning_categories: string[];
  };
}

const COLORS = ['#1976d2', '#388e3c', '#d32f2f'];

export default function Comparison() {
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [savedPortfolios, setSavedPortfolios] = useState<SavedBacktest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  
  const [portfolios, setPortfolios] = useState<PortfolioConfig[]>([
    { id: 'portfolio_1', name: '組合 1', holdings: [{ symbol: 'VTI', weight: 1.0 }] },
    { id: 'portfolio_2', name: '組合 2', holdings: [{ symbol: 'VTI', weight: 0.6 }, { symbol: 'BND', weight: 0.4 }] },
  ]);
  
  const [parameters, setParameters] = useState({
    start_date: '2020-01-01',
    end_date: '2025-01-01',
    initial_amount: 10000,
    monthly_contribution: 0,
    rebalance_frequency: 'yearly',
    reinvest_dividends: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [etfsData, savedData] = await Promise.all([
        etfAPI.getAll(),
        savedBacktestAPI.getAll(),
      ]);
      setEtfs(etfsData);
      setSavedPortfolios(savedData.items || []);
    } catch (err) {
      setError('載入資料失敗');
    }
  };

  const loadSavedPortfolio = (portfolioId: string, savedId: number) => {
    const saved = savedPortfolios.find(p => p.id === savedId);
    const portfolioData = saved?.portfolio;
    if (portfolioData && portfolioData.length > 0) {
      setPortfolios(portfolios.map(p => 
        p.id === portfolioId 
          ? { ...p, name: saved.name, holdings: portfolioData.map(h => ({ symbol: h.symbol, weight: h.weight })) }
          : p
      ));
    }
  };

  const addPortfolio = () => {
    if (portfolios.length >= 3) {
      setError('最多只能比較 3 組投資組合');
      return;
    }
    const newId = `portfolio_${portfolios.length + 1}`;
    setPortfolios([...portfolios, { id: newId, name: `組合 ${portfolios.length + 1}`, holdings: [] }]);
  };

  const removePortfolio = (id: string) => {
    if (portfolios.length <= 2) {
      setError('至少需要 2 組投資組合進行比較');
      return;
    }
    setPortfolios(portfolios.filter(p => p.id !== id));
  };

  const updatePortfolioName = (id: string, name: string) => {
    setPortfolios(portfolios.map(p => p.id === id ? { ...p, name } : p));
  };

  const updatePortfolioHoldings = (id: string, holdings: Array<{ symbol: string; weight: number }>) => {
    setPortfolios(portfolios.map(p => p.id === id ? { ...p, holdings } : p));
  };

  const runComparison = async () => {
    // 驗證每組投資組合
    for (const portfolio of portfolios) {
      const totalWeight = portfolio.holdings.reduce((sum, h) => sum + h.weight, 0);
      if (Math.abs(totalWeight - 1.0) > 0.001) {
        setError(`「${portfolio.name}」權重總和必須為 100%，目前為 ${(totalWeight * 100).toFixed(1)}%`);
        return;
      }
      if (portfolio.holdings.length === 0) {
        setError(`「${portfolio.name}」至少需要選擇 1 檔 ETF`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await backtestAPI.comparePortfolios({
        portfolios: portfolios.map(p => ({
          id: p.id,
          name: p.name,
          holdings: p.holdings.map(h => ({ symbol: h.symbol, weight: h.weight })),
        })),
        parameters,
      });
      setResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || '比較執行失敗');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!result || !result.time_series) return null;

    const labels = result.time_series.map(d => d.date);
    const datasets = result.portfolios.map((portfolio, index) => ({
      label: portfolio.name,
      data: result.time_series.map(d => d[portfolio.id]),
      borderColor: COLORS[index],
      backgroundColor: COLORS[index] + '20',
      tension: 0.1,
    }));

    return { labels, datasets };
  };

  const chartOptions = getChartOptionsWithZoom({
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '累積報酬比較',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `$${Number(value).toLocaleString()}`,
        },
      },
    },
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        投資組合比較
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 左側：組合設定 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">投資組合設定</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={addPortfolio}
                disabled={portfolios.length >= 3}
              >
                新增組合
              </Button>
            </Box>

            {portfolios.map((portfolio, index) => (
              <Card key={portfolio.id} sx={{ mb: 2, borderLeft: 4, borderColor: COLORS[index] }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <TextField
                      label="組合名稱"
                      value={portfolio.name}
                      onChange={(e) => updatePortfolioName(portfolio.id, e.target.value)}
                      size="small"
                      sx={{ flexGrow: 1, mr: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {savedPortfolios.length > 0 && (
                        <Tooltip title="載入已儲存組合">
                          <FormControl size="small" sx={{ minWidth: 40 }}>
                            <Select
                              value=""
                              onChange={(e) => {
                                const savedId = Number(e.target.value);
                                if (savedId) loadSavedPortfolio(portfolio.id, savedId);
                              }}
                              displayEmpty
                              renderValue={() => <FolderOpenIcon fontSize="small" />}
                              sx={{ 
                                '& .MuiSelect-select': { 
                                  py: 0.5, 
                                  px: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                } 
                              }}
                            >
                              <MenuItem disabled value="">
                                選擇已儲存的組合
                              </MenuItem>
                              {savedPortfolios.map((saved) => (
                                <MenuItem key={saved.id} value={saved.id}>
                                  <Box>
                                    <Typography variant="body2">{saved.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {saved.portfolio?.length || 0} 檔 ETF
                                    </Typography>
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Tooltip>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => removePortfolio(portfolio.id)}
                        disabled={portfolios.length <= 2}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <ETFSelector
                    selectedETFs={portfolio.holdings}
                    onChange={(holdings) => updatePortfolioHoldings(portfolio.id, holdings)}
                    availableETFs={etfs}
                  />
                </CardContent>
              </Card>
            ))}

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>回測參數</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="起始日期"
                  type="date"
                  value={parameters.start_date}
                  onChange={(e) => setParameters({ ...parameters, start_date: e.target.value })}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="結束日期"
                  type="date"
                  value={parameters.end_date}
                  onChange={(e) => setParameters({ ...parameters, end_date: e.target.value })}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="初始投資金額"
                  type="number"
                  value={parameters.initial_amount}
                  onChange={(e) => setParameters({ ...parameters, initial_amount: Number(e.target.value) })}
                  size="small"
                  fullWidth
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<CompareIcon />}
              onClick={runComparison}
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? '比較中...' : '開始比較'}
            </Button>
          </Paper>
        </Grid>

        {/* 右側：比較結果 */}
        <Grid item xs={12} md={8}>
          {result ? (
            <Box>
              {/* 勝出者卡片 */}
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.light' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrophyIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h5" color="success.contrastText">
                      「{result.winner.name}」勝出！
                    </Typography>
                    <Typography variant="body1" color="success.contrastText">
                      在 {result.winner.score}/{result.winner.total_metrics} 項指標中表現最佳
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {result.winner.winning_categories.map((cat, idx) => (
                        <Chip
                          key={idx}
                          label={cat}
                          size="small"
                          sx={{ mr: 1, bgcolor: 'warning.main', color: 'warning.contrastText' }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {/* 圖表 */}
              <Paper sx={{ p: 3, mb: 3 }}>
                {getChartData() && (
                  <Line data={getChartData()!} options={chartOptions} />
                )}
              </Paper>

              {/* 比較表格 */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>指標比較</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {result.comparison_table.headers.map((header, idx) => (
                          <TableCell key={idx} sx={{ fontWeight: 'bold' }}>
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.comparison_table.rows.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            {row.metric}
                            <Typography variant="caption" display="block" color="text.secondary">
                              {row.unit}
                            </Typography>
                          </TableCell>
                          {result.portfolios.map((portfolio) => (
                            <TableCell
                              key={portfolio.id}
                              sx={{
                                fontWeight: row.best === portfolio.id ? 'bold' : 'normal',
                                bgcolor: row.best === portfolio.id ? 'success.light' : 'inherit',
                              }}
                            >
                              {row[portfolio.id]}
                              {row.best === portfolio.id && (
                                <Chip
                                  label="最佳"
                                  size="small"
                                  color="success"
                                  sx={{ ml: 1, height: 20 }}
                                />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          ) : (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <CompareIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                設定投資組合並點擊「開始比較」
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                支援同時比較 2-3 組投資組合
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      <LoadingOverlay open={loading} message="正在比較投資組合..." />
    </Box>
  );
}
