import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Slider,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import { backtestAPI } from '../services/api';
import LoadingOverlay from '../components/LoadingOverlay';
import ErrorAlert from '../components/ErrorAlert';
import PortfolioSelector from '../components/PortfolioSelector';
import type { MonteCarloResponse } from '../types';

const SIMULATION_YEARS_OPTIONS = [10, 20, 30, 40, 50];
const SIMULATION_COUNT_OPTIONS = [100, 500, 1000, 5000];

const MonteCarlo: React.FC = () => {
  // 狀態
  const [portfolio, setPortfolio] = useState<{ symbol: string; weight: number }[]>([]);
  const [years, setYears] = useState(30);
  const [initialAmount, setInitialAmount] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [simulations, setSimulations] = useState(1000);
  const [targetAmount, setTargetAmount] = useState(1000000);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MonteCarloResponse | null>(null);

  // 檢查權重總和
  const totalWeight = portfolio.reduce((sum, p) => sum + p.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;

  // 執行模擬
  const runSimulation = async () => {
    if (portfolio.length === 0) {
      setError('請先選擇至少一檔 ETF');
      return;
    }

    if (!isWeightValid) {
      setError('權重總和必須為 100%');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await backtestAPI.runMonteCarlo({
        portfolio,
        years,
        initial_amount: initialAmount,
        monthly_contribution: monthlyContribution,
        simulations,
        confidence_levels: [0.1, 0.25, 0.5, 0.75, 0.9, 0.95],
      });

      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || '模擬執行失敗');
    } finally {
      setLoading(false);
    }
  };

  // 準備圖表數據
  const chartData = result
    ? {
        labels: Array.from({ length: result.years + 1 }, (_, i) => 
          `第 ${i} 年`
        ),
        datasets: [
          {
            label: '95% 百分位（樂觀）',
            data: result.paths.find(p => p.percentile === '95')?.values || [],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
          },
          {
            label: '75% 百分位',
            data: result.paths.find(p => p.percentile === '75')?.values || [],
            borderColor: 'rgba(54, 162, 235, 0.8)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
          },
          {
            label: '中位數 (50%)',
            data: result.paths.find(p => p.percentile === '50')?.values || [],
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointRadius: 0,
          },
          {
            label: '25% 百分位',
            data: result.paths.find(p => p.percentile === '25')?.values || [],
            borderColor: 'rgba(255, 159, 64, 0.8)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
          },
          {
            label: '5% 百分位（悲觀）',
            data: result.paths.find(p => p.percentile === '5')?.values || [],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
          },
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
        text: `蒙地卡羅模擬結果 (${years}年, ${simulations}次)`,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: $${context.raw.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: 15,
          maxRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => `$${(Number(value) / 1000).toFixed(0)}k`,
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <LoadingOverlay show={loading} message={`執行蒙地卡羅模擬 (${simulations}次)...`} />

      <Typography variant="h4" gutterBottom>
        蒙地卡羅模擬
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        基於歷史報酬和波動率，預測投資組合未來可能的多種走勢
      </Typography>

      <ErrorAlert error={error} onClose={() => setError(null)} />

      <Grid container spacing={3}>
        {/* 左側：設定表單 */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                模擬設定
              </Typography>

              {/* 投資組合選擇器 */}
              <PortfolioSelector
                portfolio={portfolio}
                onPortfolioChange={setPortfolio}
                minEtfs={1}
                maxEtfs={10}
                showSaveLoad={true}
              />

              <Divider sx={{ my: 2 }} />

              {/* 初始金額 */}
              <TextField
                label="初始投資金額"
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Number(e.target.value))}
                InputProps={{ startAdornment: '$' }}
                fullWidth
                sx={{ mb: 2 }}
              />

              {/* 定期定額 */}
              <TextField
                label="每月定期投入"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                InputProps={{ startAdornment: '$' }}
                fullWidth
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              {/* 模擬年數 */}
              <Typography variant="subtitle2" gutterBottom>
                模擬年數: {years} 年
              </Typography>
              <Slider
                value={years}
                onChange={(_, value) => setYears(value as number)}
                step={null}
                marks={SIMULATION_YEARS_OPTIONS.map(y => ({ value: y, label: `${y}` }))}
                min={10}
                max={50}
                sx={{ mb: 3 }}
              />

              {/* 模擬次數 */}
              <Typography variant="subtitle2" gutterBottom>
                模擬次數: {simulations.toLocaleString()} 次
              </Typography>
              <Slider
                value={simulations}
                onChange={(_, value) => setSimulations(value as number)}
                step={null}
                marks={SIMULATION_COUNT_OPTIONS.map(s => ({ 
                  value: s, 
                  label: s >= 1000 ? `${s/1000}k` : `${s}` 
                }))}
                min={100}
                max={5000}
                sx={{ mb: 3 }}
              />

              {/* 目標金額 */}
              <TextField
                label="目標金額（用於計算成功率）"
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                InputProps={{ startAdornment: '$' }}
                fullWidth
                sx={{ mb: 2 }}
              />

              {/* 執行按 */}
              <Button
                variant="contained"
                fullWidth
                onClick={runSimulation}
                disabled={loading || portfolio.length === 0 || !isWeightValid}
                size="large"
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    模擬中...
                  </>
                ) : (
                  '執行模擬'
                )}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* 右側：結果展示 */}
        <Grid item xs={12} md={8}>
          {result ? (
            <>
              {/* 成功率摘要 */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    達成目標機率
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        達成 ${targetAmount.toLocaleString()}
                      </Typography>
                      <Typography variant="h4" color="success.main">
                        {((result.success_probability?.[targetAmount.toString()] || 0) * 100).toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        最終價值（中位數）
                      </Typography>
                      <Typography variant="h4">
                        ${Math.round(result.percentiles['50']?.[years.toString()] || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        最樂觀 (95%)
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        ${Math.round(result.percentiles['95']?.[years.toString()] || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        最悲觀 (5%)
                      </Typography>
                      <Typography variant="h5" color="error.main">
                        ${Math.round(result.percentiles['5']?.[years.toString()] || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 圖表 */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  {chartData && <Line data={chartData} options={chartOptions} />}
                </CardContent>
              </Card>

              {/* 百分位數表格 */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    關鍵年份預測價值
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '8px' }}>百分位</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>第 5 年</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>第 10 年</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>第 20 年</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>最終 ({years}年)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['95', '75', '50', '25', '5'].map((p) => (
                          <tr key={p}>
                            <td style={{ padding: '8px' }}>
                              <Chip 
                                label={`${p}%`} 
                                size="small"
                                color={p === '50' ? 'primary' : 'default'}
                              />
                            </td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>
                              ${Math.round(result.percentiles[p]?.['5'] || 0).toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>
                              ${Math.round(result.percentiles[p]?.['10'] || 0).toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'right', padding: '8px' }}>
                              ${Math.round(result.percentiles[p]?.['20'] || 0).toLocaleString()}
                            </td>
                            <td style={{ textAlign: 'right', padding: '8px', fontWeight: 'bold' }}>
                              ${Math.round(result.percentiles[p]?.[years.toString()] || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box textAlign="center">
                <Typography color="text.secondary" gutterBottom>
                  設定模擬參數並點擊「執行模擬」
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  模擬次數越多，結果越準確，但計算時間也會增加
                </Typography>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default MonteCarlo;
