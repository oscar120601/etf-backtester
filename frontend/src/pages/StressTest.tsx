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
  Button,
  Alert,
  Chip,
  Card,
  CardContent,
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
  Warning as WarningIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { stressTestAPI, etfAPI } from '../services/api';
import type { ETF } from '../types';
import LoadingOverlay from '../components/LoadingOverlay';

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

const StressTest: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 壓力測試狀態
  const [selectedEtfs, setSelectedEtfs] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [singleResult, setSingleResult] = useState<any>(null);
  const [allResults, setAllResults] = useState<any>(null);

  // 載入資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const [etfsData, scenariosData] = await Promise.all([
          etfAPI.getAll(),
          stressTestAPI.getScenarios(),
        ]);
        setEtfs(etfsData);
        setScenarios(scenariosData.scenarios);
        if (scenariosData.scenarios.length > 0) {
          setSelectedScenario(scenariosData.scenarios[0].id);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };
    loadData();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 執行單一情境測試
  const handleSingleTest = async () => {
    if (selectedEtfs.length < 2) {
      setError('請至少選擇 2 檔 ETF');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const portfolio: Record<string, number> = {};
      selectedEtfs.forEach(symbol => {
        portfolio[symbol] = (weights[symbol] || 100 / selectedEtfs.length) / 100;
      });

      const response = await stressTestAPI.runStressTest({
        portfolio,
        scenario_id: selectedScenario,
      });
      setSingleResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || '測試失敗');
    } finally {
      setLoading(false);
    }
  };

  // 執行全部情境測試
  const handleAllTests = async () => {
    if (selectedEtfs.length < 2) {
      setError('請至少選擇 2 檔 ETF');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const portfolio: Record<string, number> = {};
      selectedEtfs.forEach(symbol => {
        portfolio[symbol] = (weights[symbol] || 100 / selectedEtfs.length) / 100;
      });

      const response = await stressTestAPI.runAllStressTests({ portfolio });
      setAllResults(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || '測試失敗');
    } finally {
      setLoading(false);
    }
  };

  // 格式化百分比

  return (
    <Box sx={{ p: 3 }}>
      {/* 標題 */}
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="error" />
        壓力測試
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        模擬投資組合在歷史危機期間的表現，評估組合的風險韌性
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
          <Tab label="單一情境測試" />
          <Tab label="全部情境測試" />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {/* 設定面板 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              測試設定
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>選擇 ETF</InputLabel>
              <Select
                multiple
                value={selectedEtfs}
                onChange={(e) => {
                  const symbols = e.target.value as string[];
                  setSelectedEtfs(symbols);
                  const newWeights: Record<string, number> = {};
                  symbols.forEach(s => {
                    newWeights[s] = weights[s] || (100 / symbols.length);
                  });
                  setWeights(newWeights);
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

            {selectedEtfs.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>權重設定</Typography>
                {selectedEtfs.map(symbol => (
                  <Box key={symbol} sx={{ mb: 2 }}>
                    <Typography variant="caption">{symbol}</Typography>
                    <Chip
                      label={`${(weights[symbol] || (100 / selectedEtfs.length)).toFixed(0)}%`}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                ))}
              </Box>
            )}

            <TabPanel value={tabValue} index={0}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>危機情境</InputLabel>
                <Select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                >
                  {scenarios.map((scenario) => (
                    <MenuItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedScenario && (
                <Card variant="outlined" sx={{ mb: 3, bgcolor: '#fff3e0' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="warning.dark">
                      {scenarios.find(s => s.id === selectedScenario)?.description}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              <Button
                variant="contained"
                fullWidth
                onClick={handleSingleTest}
                disabled={loading || selectedEtfs.length < 2 || !selectedScenario}
                startIcon={<TrendingDownIcon />}
              >
                執行測試
              </Button>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Button
                variant="contained"
                fullWidth
                color="secondary"
                onClick={handleAllTests}
                disabled={loading || selectedEtfs.length < 2}
                startIcon={<TimelineIcon />}
              >
                測試所有情境
              </Button>
            </TabPanel>

            {loading && <LinearProgress sx={{ mt: 2 }} />}
          </Paper>
        </Grid>

        {/* 結果顯示 */}
        <Grid item xs={12} md={8}>
          <TabPanel value={tabValue} index={0}>
            {singleResult ? (
              <SingleTestResult result={singleResult} />
            ) : (
              <PlaceholderCard />
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {allResults ? (
              <AllTestsResult results={allResults} />
            ) : (
              <PlaceholderCard />
            )}
          </TabPanel>
        </Grid>
      </Grid>

      <LoadingOverlay open={loading} message="正在執行壓力測試..." />
    </Box>
  );
};

// 單一測試結果組件
const SingleTestResult: React.FC<{ result: any }> = ({ result }) => {
  const isPositive = result.portfolio_return >= 0;
  const outperformed = result.excess_return >= 0;

  return (
    <>
      <Card sx={{ mb: 3, bgcolor: isPositive ? '#e8f5e9' : '#ffebee' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {result.scenario.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {result.scenario.description}
          </Typography>
          <Typography variant="caption" display="block">
            期間: {result.scenario.start_date} ~ {result.scenario.end_date}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                投資組合報酬
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: isPositive ? 'success.main' : 'error.main' }}
              >
                {result.portfolio_return >= 0 ? '+' : ''}
                {result.portfolio_return}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                基準 ({result.scenario.benchmark}) 報酬
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: result.benchmark_return >= 0 ? 'success.main' : 'error.main' }}
              >
                {result.benchmark_return >= 0 ? '+' : ''}
                {result.benchmark_return}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                相對表現
              </Typography>
              <Typography
                variant="h4"
                sx={{ color: outperformed ? 'success.main' : 'error.main' }}
              >
                {outperformed ? '+' : ''}
                {result.excess_return}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          詳細指標
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>最大回撤</TableCell>
                <TableCell align="right" sx={{ color: 'error.main' }}>
                  {result.max_drawdown}%
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>恢復時間</TableCell>
                <TableCell align="right">
                  {result.recovery_days ? `${result.recovery_days} 天` : '尚未恢復'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

// 全部測試結果組件
const AllTestsResult: React.FC<{ results: any }> = ({ results }) => {
  const summary = results.summary;

  return (
    <>
      {summary && (
        <Card sx={{ mb: 3, bgcolor: '#e3f2fd' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              韌性評估
            </Typography>
            <Typography variant="h3" color="primary" gutterBottom>
              {summary.resilience_score?.score}/100
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              {summary.resilience_score?.rating}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {summary.resilience_score?.description}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          各情境測試結果
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>情境</TableCell>
                <TableCell align="right">組合報酬</TableCell>
                <TableCell align="right">基準報酬</TableCell>
                <TableCell align="right">超額報酬</TableCell>
                <TableCell align="right">最大回撤</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.results?.map((result: any) => (
                <TableRow key={result.scenario_id}>
                  <TableCell>{result.scenario_name}</TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: result.portfolio_return >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {result.portfolio_return}%
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: result.benchmark_return >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {result.benchmark_return}%
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: result.excess_return >= 0 ? 'success.main' : 'error.main' }}
                  >
                    {result.excess_return > 0 ? '+' : ''}
                    {result.excess_return}%
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>
                    {result.max_drawdown}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </>
  );
};

// 佔位卡片
const PlaceholderCard: React.FC = () => (
  <Paper sx={{ p: 6, textAlign: 'center' }}>
    <WarningIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
    <Typography variant="h6" color="text.secondary">
      選擇 ETF 並點擊「執行測試」
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
      壓力測試將模擬投資組合在歷史危機期間的表現
    </Typography>
  </Paper>
);

export default StressTest;
