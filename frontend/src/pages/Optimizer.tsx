import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  TextField,
  Button,
  Alert,
  Chip,
  Tooltip,
  IconButton,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon,
  AutoGraph as AutoGraphIcon,
} from '@mui/icons-material';
import { optimizerAPI, etfAPI } from '../services/api';
import type {
  ETF,
  OptimizationResponse,
  OptimizedPortfolio,
} from '../types';
import EfficientFrontierChart from '../components/EfficientFrontierChart';
import LoadingOverlay from '../components/LoadingOverlay';

const Optimizer: React.FC = () => {
  // 狀態
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [selectedEtfs, setSelectedEtfs] = useState<string[]>([]);
  const [objective, setObjective] = useState<'max_sharpe' | 'min_volatility' | 'target_return'>('max_sharpe');
  const [targetReturn, setTargetReturn] = useState<number>(8);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(4.5);
  const [minWeight, setMinWeight] = useState<number>(5);
  const [maxWeight, setMaxWeight] = useState<number>(50);
  const [lookbackYears, setLookbackYears] = useState<number>(5);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResponse | null>(null);

  // 載入 ETF 列表
  useEffect(() => {
    const loadETFs = async () => {
      try {
        const data = await etfAPI.getAll();
        setEtfs(data);
        // 預設選擇前 4 檔
        if (data.length >= 4) {
          setSelectedEtfs(data.slice(0, 4).map(e => e.symbol));
        }
      } catch (err) {
        console.error('Failed to load ETFs:', err);
      }
    };
    loadETFs();
  }, []);

  // 執行優化
  const handleOptimize = async () => {
    if (selectedEtfs.length < 2) {
      setError('請至少選擇 2 檔 ETF');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await optimizerAPI.optimize({
        symbols: selectedEtfs,
        objective,
        target_return: objective === 'target_return' ? targetReturn / 100 : undefined,
        risk_free_rate: riskFreeRate / 100,
        weight_constraints: {
          min: minWeight / 100,
          max: maxWeight / 100,
        },
        lookback_years: lookbackYears,
      });
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || '優化失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  // 格式化百分比
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

  // 格式化數字
  const formatNumber = (value: number, decimals: number = 2) => value.toFixed(decimals);

  return (
    <Box sx={{ p: 3 }}>
      {/* 標題 */}
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoGraphIcon />
        投資組合優化器
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        基於現代投資組合理論 (MPT)，計算效率前緣並找出最佳資產配置。學習標竿：Portfolio Visualizer
      </Typography>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* 左側：設定面板 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              優化設定
            </Typography>

            {/* ETF 選擇 */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>選擇 ETF（可多選）</InputLabel>
              <Select
                multiple
                value={selectedEtfs}
                onChange={(e) => setSelectedEtfs(e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {etfs.map((etf) => (
                  <MenuItem key={etf.symbol} value={etf.symbol}>
                    {etf.symbol} - {etf.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 優化目標 */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>優化目標</InputLabel>
              <Select
                value={objective}
                onChange={(e) => setObjective(e.target.value as any)}
              >
                <MenuItem value="max_sharpe">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon fontSize="small" />
                    最大夏普比率（推薦）
                  </Box>
                </MenuItem>
                <MenuItem value="min_volatility">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingDownIcon fontSize="small" />
                    最小波動率
                  </Box>
                </MenuItem>
                <MenuItem value="target_return">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShowChartIcon fontSize="small" />
                    目標報酬率
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {/* 目標報酬率（僅在目標報酬模式顯示） */}
            {objective === 'target_return' && (
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  目標年化報酬率: {targetReturn}%
                </Typography>
                <Slider
                  value={targetReturn}
                  onChange={(_, value) => setTargetReturn(value as number)}
                  min={0}
                  max={20}
                  step={0.5}
                  marks={[{ value: 0, label: '0%' }, { value: 10, label: '10%' }, { value: 20, label: '20%' }]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v}%`}
                />
              </Box>
            )}

            {/* 無風險利率 */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                無風險利率: {riskFreeRate}%
                <Tooltip title="通常使用 10 年期政府公債收益率作為無風險利率">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Slider
                value={riskFreeRate}
                onChange={(_, value) => setRiskFreeRate(value as number)}
                min={0}
                max={10}
                step={0.1}
                marks={[{ value: 0, label: '0%' }, { value: 5, label: '5%' }, { value: 10, label: '10%' }]}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}%`}
              />
            </Box>

            {/* 權重限制 */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                權重限制
                <Tooltip title="設定單一 ETF 的最小和最大權重，避免過度集中">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="最小權重"
                    type="number"
                    value={minWeight}
                    onChange={(e) => setMinWeight(Number(e.target.value))}
                    InputProps={{ endAdornment: '%' }}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="最大權重"
                    type="number"
                    value={maxWeight}
                    onChange={(e) => setMaxWeight(Number(e.target.value))}
                    InputProps={{ endAdornment: '%' }}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* 回溯期間 */}
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                回溯期間: {lookbackYears} 年
              </Typography>
              <Slider
                value={lookbackYears}
                onChange={(_, value) => setLookbackYears(value as number)}
                min={1}
                max={10}
                step={1}
                marks={[{ value: 1, label: '1年' }, { value: 5, label: '5年' }, { value: 10, label: '10年' }]}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v}年`}
              />
            </Box>

            {/* 執行按鈕 */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleOptimize}
              disabled={loading || selectedEtfs.length < 2}
              startIcon={<AutoGraphIcon />}
            >
              {loading ? '優化中...' : '執行優化'}
            </Button>

            {loading && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>

          {/* 說明卡片 */}
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              優化目標說明
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>最大夏普比率：</strong>在給定風險水平下最大化報酬，或在給定報酬水平下最小化風險。推薦給大多數投資者。
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>最小波動率：</strong>找出波動率（風險）最低的投資組合。適合保守型投資者和退休規劃。
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>目標報酬率：</strong>在達到指定目標報酬率的前提下，最小化投資組合風險。
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* 右側：結果顯示 */}
        <Grid item xs={12} md={8}>
          {result ? (
            <>
              {/* 效率前緣圖表 */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  效率前緣曲線
                </Typography>
                <EfficientFrontierChart
                  frontier={result.efficient_frontier}
                  individualAssets={result.individual_assets}
                  maxSharpePoint={result.recommended_portfolios.max_sharpe}
                  minVolPoint={result.recommended_portfolios.min_volatility}
                />
              </Paper>

              {/* 推薦組合 */}
              <Grid container spacing={3}>
                {Object.entries(result.recommended_portfolios).map(([key, portfolio]) => (
                  <Grid item xs={12} md={key === 'custom' ? 12 : 6} key={key}>
                    <PortfolioResultCard portfolio={portfolio} />
                  </Grid>
                ))}
              </Grid>

              {/* 單一資產比較 */}
              <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  單一資產績效（作為參考）
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ETF</TableCell>
                        <TableCell align="right">預期報酬</TableCell>
                        <TableCell align="right">波動率</TableCell>
                        <TableCell align="right">夏普比率</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.individual_assets.map((asset) => (
                        <TableRow key={asset.symbol}>
                          <TableCell>{asset.symbol}</TableCell>
                          <TableCell align="right" sx={{ color: asset.expected_return >= 0 ? 'success.main' : 'error.main' }}>
                            {formatPercent(asset.expected_return)}
                          </TableCell>
                          <TableCell align="right">
                            {formatPercent(asset.volatility)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            {formatNumber(asset.sharpe_ratio)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          ) : (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <AutoGraphIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                準備開始優化
              </Typography>
              <Typography variant="body2" color="text.secondary">
                在左側選擇 ETF 和優化參數，然後點擊「執行優化」按鈕
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* 載入遮罩 */}
      <LoadingOverlay open={loading} message="正在計算最佳投資組合配置..." />
    </Box>
  );
};

// 組合結果卡片組件
interface PortfolioResultCardProps {
  portfolio: OptimizedPortfolio;
}

const PortfolioResultCard: React.FC<PortfolioResultCardProps> = ({ portfolio }) => {
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatNumber = (value: number) => value.toFixed(2);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom color="primary">
          {portfolio.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {portfolio.description}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* 績效指標 */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              預期報酬
            </Typography>
            <Typography variant="h6" sx={{ color: portfolio.expected_return >= 0 ? 'success.main' : 'error.main' }}>
              {formatPercent(portfolio.expected_return)}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              波動率
            </Typography>
            <Typography variant="h6">
              {formatPercent(portfolio.volatility)}
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="caption" color="text.secondary" display="block">
              夏普比率
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: portfolio.sharpe_ratio > 1 ? 'success.main' : 'inherit' }}>
              {formatNumber(portfolio.sharpe_ratio)}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* 權重配置 */}
        <Typography variant="subtitle2" gutterBottom>
          建議配置
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(portfolio.weights)
            .filter(([, weight]) => weight > 0.001)
            .sort(([, a], [, b]) => b - a)
            .map(([symbol, weight]) => (
              <Chip
                key={symbol}
                label={`${symbol}: ${formatPercent(weight)}`}
                size="small"
                color="primary"
                variant={weight > 0.3 ? 'filled' : 'outlined'}
              />
            ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default Optimizer;
