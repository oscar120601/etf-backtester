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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  MultilineChart as MultilineChartIcon,
} from '@mui/icons-material';
import { analysisAPI, etfAPI } from '../services/api';
import type { ETF } from '../types';
import LoadingOverlay from '../components/LoadingOverlay';
import RollingReturnsChart from '../components/RollingReturnsChart';
import CorrelationHeatmap from '../components/CorrelationHeatmap';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Analysis: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 滾動報酬狀態
  const [rollingSymbols, setRollingSymbols] = useState<string[]>([]);
  const [rollingWeights, setRollingWeights] = useState<Record<string, number>>({});
  const [rollingWindowYears, setRollingWindowYears] = useState<number[]>([1, 3, 5, 10]);
  const [rollingResult, setRollingResult] = useState<any>(null);

  // 相關性矩陣狀態
  const [corrSymbols, setCorrSymbols] = useState<string[]>([]);
  const [corrLookback, setCorrLookback] = useState<number>(3);
  const [corrResult, setCorrResult] = useState<any>(null);

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

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 執行滾動報酬分析
  const handleRollingReturns = async () => {
    if (rollingSymbols.length < 2) {
      setError('請至少選擇 2 檔 ETF');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const portfolio: Record<string, number> = {};
      rollingSymbols.forEach(symbol => {
        portfolio[symbol] = rollingWeights[symbol] || (1 / rollingSymbols.length);
      });

      // 正規化權重
      const totalWeight = Object.values(portfolio).reduce((a, b) => a + b, 0);
      Object.keys(portfolio).forEach(key => {
        portfolio[key] = portfolio[key] / totalWeight;
      });

      const response = await analysisAPI.getRollingReturns({
        portfolio,
        window_years: rollingWindowYears,
      });
      setRollingResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || '分析失敗');
    } finally {
      setLoading(false);
    }
  };

  // 執行相關性分析
  const handleCorrelation = async () => {
    if (corrSymbols.length < 2) {
      setError('請至少選擇 2 檔 ETF');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await analysisAPI.getCorrelationMatrix({
        symbols: corrSymbols.join(','),
        lookback_years: corrLookback,
      });
      setCorrResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || '分析失敗');
    } finally {
      setLoading(false);
    }
  };

  // 格式化百分比
  const formatPercent = (value: number) => `${value?.toFixed?.(2) ?? 0}%`;

  return (
    <Box sx={{ p: 3 }}>
      {/* 標題 */}
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BarChartIcon />
        投資分析工具
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        深入分析投資組合特性，包含滾動報酬分布和資產相關性分析
      </Typography>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 分頁 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab 
            icon={<TrendingUpIcon />} 
            label="滾動報酬分析" 
            iconPosition="start"
          />
          <Tab 
            icon={<MultilineChartIcon />} 
            label="相關性矩陣" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* 滾動報酬分析 */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* 設定面板 */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                滾動報酬設定
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>選擇 ETF</InputLabel>
                <Select
                  multiple
                  value={rollingSymbols}
                  onChange={(e) => {
                    const symbols = e.target.value as string[];
                    setRollingSymbols(symbols);
                    // 初始化權重
                    const weights: Record<string, number> = {};
                    symbols.forEach(s => {
                      weights[s] = rollingWeights[s] || (100 / symbols.length);
                    });
                    setRollingWeights(weights);
                  }}
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

              {/* 權重設定 */}
              {rollingSymbols.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom>權重設定</Typography>
                  {rollingSymbols.map(symbol => (
                    <Box key={symbol} sx={{ mb: 2 }}>
                      <Typography variant="caption">{symbol}</Typography>
                      <Slider
                        value={rollingWeights[symbol] || (100 / rollingSymbols.length)}
                        onChange={(_, value) => setRollingWeights({
                          ...rollingWeights,
                          [symbol]: value as number
                        })}
                        min={0}
                        max={100}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${v.toFixed(0)}%`}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  滾動期間
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[1, 3, 5, 10].map(year => (
                    <Chip
                      key={year}
                      label={`${year}年`}
                      onClick={() => {
                        if (rollingWindowYears.includes(year)) {
                          setRollingWindowYears(rollingWindowYears.filter(y => y !== year));
                        } else {
                          setRollingWindowYears([...rollingWindowYears, year].sort());
                        }
                      }}
                      color={rollingWindowYears.includes(year) ? 'primary' : 'default'}
                      variant={rollingWindowYears.includes(year) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={handleRollingReturns}
                disabled={loading || rollingSymbols.length < 2}
              >
                {loading ? '計算中...' : '執行分析'}
              </Button>

              {loading && <LinearProgress sx={{ mt: 2 }} />}
            </Paper>

            {/* 說明 */}
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                什麼是滾動報酬？
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                滾動報酬分析顯示在不同持有期間（如 1年、3年、5年）的報酬率分布。
                這有助於了解投資組合在各種持有期間的表現穩定性。
              </Typography>
              <Typography variant="body2" color="text.secondary">
                例如：3年滾動報酬顯示在歷史上任意連續 3 年期間的報酬率分布。
              </Typography>
            </Paper>
          </Grid>

          {/* 結果顯示 */}
          <Grid item xs={12} md={8}>
            {rollingResult ? (
              <>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    滾動報酬圖表
                  </Typography>
                  <RollingReturnsChart periods={rollingResult.periods} />
                </Paper>

                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    統計摘要
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>期間</TableCell>
                          <TableCell align="right">平均報酬</TableCell>
                          <TableCell align="right">中位數</TableCell>
                          <TableCell align="right">標準差</TableCell>
                          <TableCell align="right">最佳</TableCell>
                          <TableCell align="right">最差</TableCell>
                          <TableCell align="right">正報酬比例</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(rollingResult.periods).map(([window, data]: [string, any]) => (
                          <TableRow key={window}>
                            <TableCell>{window} 年</TableCell>
                            <TableCell align="right" sx={{ color: data.stats.mean >= 0 ? 'success.main' : 'error.main' }}>
                              {formatPercent(data.stats.mean)}
                            </TableCell>
                            <TableCell align="right">
                              {formatPercent(data.stats.median)}
                            </TableCell>
                            <TableCell align="right">
                              {formatPercent(data.stats.std)}
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'success.main' }}>
                              {formatPercent(data.stats.max)}
                            </TableCell>
                            <TableCell align="right" sx={{ color: 'error.main' }}>
                              {formatPercent(data.stats.min)}
                            </TableCell>
                            <TableCell align="right">
                              {formatPercent(data.stats.positive_ratio)}
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
                <TrendingUpIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  選擇 ETF 並點擊「執行分析」
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* 相關性矩陣 */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* 設定面板 */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                相關性分析設定
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>選擇 ETF</InputLabel>
                <Select
                  multiple
                  value={corrSymbols}
                  onChange={(e) => setCorrSymbols(e.target.value as string[])}
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

              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  回溯期間: {corrLookback} 年
                </Typography>
                <Slider
                  value={corrLookback}
                  onChange={(_, value) => setCorrLookback(value as number)}
                  min={1}
                  max={10}
                  step={1}
                  marks={[{ value: 1, label: '1年' }, { value: 5, label: '5年' }, { value: 10, label: '10年' }]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v}年`}
                />
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={handleCorrelation}
                disabled={loading || corrSymbols.length < 2}
              >
                {loading ? '計算中...' : '計算相關性'}
              </Button>

              {loading && <LinearProgress sx={{ mt: 2 }} />}
            </Paper>

            {/* 說明 */}
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                什麼是相關性？
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                相關性係數衡量兩個資產價格走勢的關聯程度：
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary">
                  <strong style={{ color: '#d32f2f' }}>+1.0</strong>：完全正相關（同漲同跌）
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  <strong>0</strong>：無相關（走勢獨立）
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  <strong style={{ color: '#1976d2' }}>-1.0</strong>：完全負相關（此消彼長）
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                選擇相關性較低的資產可以提升分散化效果。
              </Typography>
            </Paper>
          </Grid>

          {/* 結果顯示 */}
          <Grid item xs={12} md={8}>
            {corrResult ? (
              <>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    相關性熱力圖
                  </Typography>
                  <CorrelationHeatmap 
                    heatmap={corrResult.heatmap}
                    symbols={corrResult.symbols}
                  />
                </Paper>

                {corrResult.summary && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      分散化評估
                    </Typography>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h4" color="primary">
                          {corrResult.summary.diversification_score?.score}/100
                        </Typography>
                        <Typography variant="subtitle1">
                          {corrResult.summary.diversification_score?.rating}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {corrResult.summary.diversification_score?.description}
                        </Typography>
                      </CardContent>
                    </Card>

                    <Typography variant="subtitle2" gutterBottom>
                      相關性排名（由高到低）
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>資產對</TableCell>
                            <TableCell align="right">相關性</TableCell>
                            <TableCell>強度</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {corrResult.summary.correlations?.slice(0, 5).map((corr: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{corr.pair}</TableCell>
                              <TableCell align="right" sx={{ 
                                color: corr.correlation > 0 ? 'error.main' : 'success.main',
                                fontWeight: 'bold'
                              }}>
                                {corr.correlation.toFixed(3)}
                              </TableCell>
                              <TableCell>{corr.level?.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
              </>
            ) : (
              <Paper sx={{ p: 6, textAlign: 'center' }}>
                <MultilineChartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  選擇 ETF 並點擊「計算相關性」
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      <LoadingOverlay open={loading} message="正在分析數據..." />
    </Box>
  );
};

export default Analysis;
