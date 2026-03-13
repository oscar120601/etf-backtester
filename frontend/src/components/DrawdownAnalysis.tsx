import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import { getChartOptionsWithZoom } from '../utils/chartConfig';
import type { BacktestResponse } from '../types';

interface DrawdownAnalysisProps {
  result: BacktestResponse;
}

export default function DrawdownAnalysis({ result }: DrawdownAnalysisProps) {
  // 分析回撤數據
  const drawdownAnalysis = useMemo(() => {
    if (!result.time_series.drawdown?.length) return null;

    const drawdowns = result.time_series.drawdown;
    const values = drawdowns.map((d) => d.value);

    // 找出最大回撤
    const maxDrawdown = Math.min(...values);
    const maxDrawdownIndex = values.indexOf(maxDrawdown);
    const maxDrawdownDate = drawdowns[maxDrawdownIndex].date;

    // 計算回撤持續時間
    let currentDrawdownStart: string | null = null;
    let longestDrawdownDays = 0;
    let longestDrawdownStart = '';
    let longestDrawdownEnd = '';
    let currentStreak = 0;

    drawdowns.forEach((point, index) => {
      if (point.value < 0) {
        if (currentDrawdownStart === null) {
          currentDrawdownStart = point.date;
          currentStreak = 1;
        } else {
          currentStreak++;
        }
      } else {
        if (currentDrawdownStart !== null && currentStreak > longestDrawdownDays) {
          longestDrawdownDays = currentStreak;
          longestDrawdownStart = currentDrawdownStart;
          longestDrawdownEnd = drawdowns[index - 1].date;
        }
        currentDrawdownStart = null;
        currentStreak = 0;
      }
    });

    // 找出所有回撤區間
    const drawdownPeriods: Array<{
      startDate: string;
      endDate: string;
      days: number;
      maxDrawdown: number;
      recoveryDate: string | null;
    }> = [];

    let inDrawdown = false;
    let periodStart = '';
    let periodMaxDrawdown = 0;

    drawdowns.forEach((point, index) => {
      if (point.value < 0 && !inDrawdown) {
        inDrawdown = true;
        periodStart = point.date;
        periodMaxDrawdown = point.value;
      } else if (point.value < 0 && inDrawdown) {
        periodMaxDrawdown = Math.min(periodMaxDrawdown, point.value);
      } else if (point.value >= 0 && inDrawdown) {
        inDrawdown = false;
        drawdownPeriods.push({
          startDate: periodStart,
          endDate: point.date,
          days: index - drawdowns.findIndex((d) => d.date === periodStart),
          maxDrawdown: periodMaxDrawdown,
          recoveryDate: point.date,
        });
      }
    });

    // 計算平均回撤
    const avgDrawdown = values.reduce((sum, v) => sum + (v < 0 ? v : 0), 0) / values.filter((v) => v < 0).length;

    // 計算回撤頻率
    const drawdownDays = values.filter((v) => v < 0).length;
    const drawdownFrequency = (drawdownDays / values.length) * 100;

    return {
      maxDrawdown,
      maxDrawdownDate,
      longestDrawdownDays,
      longestDrawdownStart,
      longestDrawdownEnd,
      avgDrawdown,
      drawdownFrequency,
      drawdownPeriods: drawdownPeriods.slice(-10), // 最近 10 次
    };
  }, [result.time_series.drawdown]);

  // 回撤圖數據
  const drawdownChartData = useMemo(() => {
    if (!result.time_series.drawdown?.length) return null;

    return {
      labels: result.time_series.drawdown.map((p) => p.date),
      datasets: [
        {
          label: '投資組合回撤',
          data: result.time_series.drawdown.map((p) => p.value * 100),
          borderColor: 'rgb(239, 83, 80)',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(239, 83, 80, 0.4)');
            gradient.addColorStop(1, 'rgba(239, 83, 80, 0.05)');
            return gradient;
          },
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    };
  }, [result.time_series.drawdown]);

  const drawdownChartOptions = getChartOptionsWithZoom({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '歷史回撤走勢 (%)',
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
          callback: (value: number) => `${value.toFixed(1)}%`,
        },
      },
    },
  });

  // 計算恢復時間統計
  const recoveryStats = useMemo(() => {
    if (!drawdownAnalysis?.drawdownPeriods.length) return null;

    const recoveries = drawdownAnalysis.drawdownPeriods.filter((p) => p.recoveryDate);
    if (!recoveries.length) return null;

    const avgRecoveryDays = recoveries.reduce((sum, p) => sum + p.days, 0) / recoveries.length;
    const maxRecoveryDays = Math.max(...recoveries.map((p) => p.days));
    const minRecoveryDays = Math.min(...recoveries.map((p) => p.days));

    return {
      avgRecoveryDays,
      maxRecoveryDays,
      minRecoveryDays,
      recoveryCount: recoveries.length,
    };
  }, [drawdownAnalysis]);

  if (!drawdownAnalysis) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">無回撤數據可供分析</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* 回撤走勢圖 */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              回撤走勢圖
            </Typography>
            <Box sx={{ height: 350 }}>
              {drawdownChartData && (
                <Line data={drawdownChartData} options={drawdownChartOptions} />
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* 關鍵指標 */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              最大回撤
            </Typography>
            <Typography variant="h3" color="error.main" gutterBottom>
              {(drawdownAnalysis.maxDrawdown * 100).toFixed(2)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              發生於 {drawdownAnalysis.maxDrawdownDate}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              最長回撤期間
            </Typography>
            <Typography variant="h3" color="warning.main" gutterBottom>
              {drawdownAnalysis.longestDrawdownDays} 天
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {drawdownAnalysis.longestDrawdownStart} ~ {drawdownAnalysis.longestDrawdownEnd}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              平均回撤
            </Typography>
            <Typography variant="h3" color="info.main" gutterBottom>
              {(drawdownAnalysis.avgDrawdown * 100).toFixed(2)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              回撤天數佔總天數 {(drawdownAnalysis.drawdownFrequency).toFixed(1)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 恢復統計 */}
      {recoveryStats && (
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                恢復時間統計
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    平均恢復
                  </Typography>
                  <Typography variant="h6">
                    {recoveryStats.avgRecoveryDays.toFixed(0)} 天
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    最長恢復
                  </Typography>
                  <Typography variant="h6">
                    {recoveryStats.maxRecoveryDays} 天
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    最短恢復
                  </Typography>
                  <Typography variant="h6">
                    {recoveryStats.minRecoveryDays} 天
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* 歷史回撤區間 */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              歷史回撤區間
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>開始日期</TableCell>
                    <TableCell>結束日期</TableCell>
                    <TableCell>持續天數</TableCell>
                    <TableCell>最大回撤</TableCell>
                    <TableCell>恢復狀態</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drawdownAnalysis.drawdownPeriods.slice().reverse().map((period, index) => (
                    <TableRow key={index}>
                      <TableCell>{period.startDate}</TableCell>
                      <TableCell>{period.endDate}</TableCell>
                      <TableCell>{period.days}</TableCell>
                      <TableCell sx={{ color: 'error.main' }}>
                        {(period.maxDrawdown * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        {period.recoveryDate ? (
                          <Chip label="已恢復" color="success" size="small" />
                        ) : (
                          <Chip label="持續中" color="warning" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
