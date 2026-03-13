import { useMemo, useRef } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, Stack } from '@mui/material';
import { Line, Bar } from 'react-chartjs-2';
import { Download as DownloadIcon, RestartAlt as ResetIcon } from '@mui/icons-material';
import { getChartOptionsWithZoom, downloadChart, resetChartZoom } from '../utils/chartConfig';
import type { BacktestResponse } from '../types';

interface BacktestChartsProps {
  result: BacktestResponse;
}

export default function BacktestCharts({ result }: BacktestChartsProps) {
  // 圖表引用
  const drawdownChartRef = useRef<any>(null);
  const annualChartRef = useRef<any>(null);
  // 回撤圖數據
  const drawdownData = useMemo(() => {
    if (!result.time_series.drawdown?.length) return null;

    return {
      labels: result.time_series.drawdown.map((p) => p.date),
      datasets: [
        {
          label: '投資組合回撤',
          data: result.time_series.drawdown.map((p) => p.value * 100),
          borderColor: 'rgb(239, 83, 80)',
          backgroundColor: 'rgba(239, 83, 80, 0.3)',
          fill: true,
          tension: 0.1,
          pointRadius: 0,
        },
      ],
    };
  }, [result.time_series.drawdown]);

  const drawdownOptions = getChartOptionsWithZoom({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '歷史回撤分析 (滾輪縮放、Ctrl+拖曳平移)',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `回撤: ${context.parsed.y.toFixed(2)}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        max: 0,
        ticks: {
          callback: (value: number) => `${value.toFixed(0)}%`,
        },
      },
    },
  });

  // 計算年度收益
  const annualReturns = useMemo(() => {
    const portfolioValues = result.time_series.portfolio_value;
    if (!portfolioValues?.length) return [];

    const yearlyData: { year: number; return: number }[] = [];
    const yearValues: { [key: number]: { first: number; last: number } } = {};

    // 按年份分組
    portfolioValues.forEach((point) => {
      const date = new Date(point.date);
      const year = date.getFullYear();

      if (!yearValues[year]) {
        yearValues[year] = { first: point.value, last: point.value };
      } else {
        yearValues[year].last = point.value;
      }
    });

    // 計算每年收益
    Object.entries(yearValues).forEach(([year, values]) => {
      const returnRate = (values.last - values.first) / values.first;
      yearlyData.push({
        year: parseInt(year),
        return: returnRate,
      });
    });

    return yearlyData.sort((a, b) => a.year - b.year);
  }, [result.time_series.portfolio_value]);

  // 年度收益圖數據
  const annualReturnData = useMemo(() => {
    if (!annualReturns.length) return null;

    return {
      labels: annualReturns.map((a) => `${a.year}`),
      datasets: [
        {
          label: '年度報酬率',
          data: annualReturns.map((a) => a.return * 100),
          backgroundColor: annualReturns.map((a) =>
            a.return >= 0 ? 'rgba(102, 187, 106, 0.8)' : 'rgba(239, 83, 80, 0.8)'
          ),
          borderColor: annualReturns.map((a) =>
            a.return >= 0 ? 'rgb(102, 187, 106)' : 'rgb(239, 83, 80)'
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [annualReturns]);

  const annualReturnOptions = getChartOptionsWithZoom({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '年度報酬率',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `報酬率: ${context.parsed.y.toFixed(2)}%`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: number) => `${value.toFixed(0)}%`,
        },
      },
    },
  });

  // 計算月度收益熱力圖數據
  const monthlyReturns = useMemo(() => {
    const portfolioValues = result.time_series.portfolio_value;
    if (!portfolioValues?.length) return [];

    const monthlyData: {
      year: number;
      month: number;
      return: number;
    }[] = [];

    // 按年月分組
    const monthValues: {
      [key: string]: { first: number; last: number };
    } = {};

    portfolioValues.forEach((point) => {
      const date = new Date(point.date);
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthValues[yearMonth]) {
        monthValues[yearMonth] = { first: point.value, last: point.value };
      } else {
        monthValues[yearMonth].last = point.value;
      }
    });

    // 計算每月收益
    Object.entries(monthValues).forEach(([yearMonth, values]) => {
      const [year, month] = yearMonth.split('-').map(Number);
      const returnRate = (values.last - values.first) / values.first;
      monthlyData.push({ year, month, return: returnRate });
    });

    return monthlyData.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [result.time_series.portfolio_value]);

  // 獲取顏色
  const getHeatmapColor = (value: number) => {
    const intensity = Math.min(Math.abs(value) * 2, 1);
    if (value >= 0) {
      return `rgba(102, 187, 106, ${0.2 + intensity * 0.8})`;
    } else {
      return `rgba(239, 83, 80, ${0.2 + intensity * 0.8})`;
    }
  };

  // 獲取唯一年份
  const years = useMemo(() => {
    const uniqueYears = [...new Set(monthlyReturns.map((m) => m.year))];
    return uniqueYears.sort((a, b) => b - a); // 降序
  }, [monthlyReturns]);

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  return (
    <Grid container spacing={3}>
      {/* 回撤圖 */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                回撤分析
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadChart(drawdownChartRef, 'drawdown_chart.png')}
                >
                  下載圖表
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ResetIcon />}
                  onClick={() => resetChartZoom(drawdownChartRef)}
                >
                  重置縮放
                </Button>
              </Stack>
            </Box>
            <Box sx={{ height: 300 }}>
              {drawdownData ? (
                <Line ref={drawdownChartRef} data={drawdownData} options={drawdownOptions} />
              ) : (
                <Typography color="text.secondary">無回撤數據</Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* 年度收益圖 */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                年度報酬率
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadChart(annualChartRef, 'annual_returns_chart.png')}
                >
                  下載
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ResetIcon />}
                  onClick={() => resetChartZoom(annualChartRef)}
                >
                  重置
                </Button>
              </Stack>
            </Box>
            <Box sx={{ height: 300 }}>
              {annualReturnData ? (
                <Bar ref={annualChartRef} data={annualReturnData} options={annualReturnOptions} />
              ) : (
                <Typography color="text.secondary">無年度數據</Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* 月度熱力圖 */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              月度收益熱力圖
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Box sx={{ display: 'flex', minWidth: 400 }}>
                {/* 月份標籤 */}
                <Box sx={{ mr: 1 }}>
                  <Box sx={{ height: 32 }} /> {/* 空白角落 */}
                  {months.map((month) => (
                    <Box
                      key={month}
                      sx={{
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                      }}
                    >
                      {month}
                    </Box>
                  ))}
                </Box>

                {/* 年份和數據 */}
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {years.map((year) => (
                    <Box key={year}>
                      <Box
                        sx={{
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: 'text.primary',
                        }}
                      >
                        {year}
                      </Box>
                      {months.map((_, monthIndex) => {
                        const data = monthlyReturns.find(
                          (m) => m.year === year && m.month === monthIndex + 1
                        );
                        return (
                          <Box
                            key={monthIndex}
                            sx={{
                              height: 28,
                              width: 40,
                              backgroundColor: data
                                ? getHeatmapColor(data.return)
                                : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              color: data && Math.abs(data.return) > 0.05 ? '#fff' : 'text.primary',
                              borderRadius: 0.5,
                            }}
                            title={
                              data
                                ? `${year}年${monthIndex + 1}月: ${(data.return * 100).toFixed(2)}%`
                                : ''
                            }
                          >
                            {data ? `${(data.return * 100).toFixed(1)}%` : ''}
                          </Box>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* 圖例 */}
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: 'rgba(239, 83, 80, 0.8)',
                      borderRadius: 0.5,
                    }}
                  />
                  <Typography variant="caption">虧損</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: 'rgba(102, 187, 106, 0.8)',
                      borderRadius: 0.5,
                    }}
                  />
                  <Typography variant="caption">盈利</Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
