import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Alert,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  TextField,
  Grid,
} from '@mui/material';
import { Add, Delete, PieChart } from '@mui/icons-material';
import { etfAPI, savedBacktestAPI } from '../services/api';
import type { ETF, SavedBacktest, PortfolioHolding } from '../types';

interface PortfolioSelectorProps {
  /** 當前投資組合配置 */
  portfolio: PortfolioHolding[];
  /** 當組合變更時的回调 */
  onPortfolioChange: (portfolio: PortfolioHolding[]) => void;
  /** 最小 ETF 數量 */
  minEtfs?: number;
  /** 最大 ETF 數量 */
  maxEtfs?: number;
  /** 是否顯示儲存/載入功能 */
  showSaveLoad?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 投資組合選擇器組件
 * 支援手動設定 ETF 權重和載入已儲存的組合
 */
export default function PortfolioSelector({
  portfolio,
  onPortfolioChange,
  minEtfs = 1,
  maxEtfs = 10,
  showSaveLoad = true,
  disabled = false,
}: PortfolioSelectorProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'saved'>('manual');
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [savedPortfolios, setSavedPortfolios] = useState<SavedBacktest[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string>('');
  const [newEtfSymbol, setNewEtfSymbol] = useState<string>('');
  const [weightInput, setWeightInput] = useState<Record<string, string>>({});

  // 計算總權重（百分比形式）
  const totalWeight = portfolio.reduce((sum, p) => sum + p.weight, 0);
  const totalWeightPercent = Math.round(totalWeight * 100);
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;
  const remainingWeight = Math.round((1 - totalWeight) * 100);

  // 載入 ETF 列表和已儲存的組合
  useEffect(() => {
    const loadData = async () => {
      try {
        const [etfsData, savedData] = await Promise.all([
          etfAPI.getAll(),
          savedBacktestAPI.getAll(),
        ]);
        setEtfs(etfsData);
        setSavedPortfolios(savedData.items || []);
      } catch (err) {
        console.error('載入資料失敗:', err);
      }
    };
    loadData();
  }, []);

  // 初始化 weightInput
  useEffect(() => {
    const newWeightInput: Record<string, string> = {};
    portfolio.forEach(p => {
      newWeightInput[p.symbol] = Math.round(p.weight * 100).toString();
    });
    setWeightInput(newWeightInput);
  }, [portfolio]);

  // 載入已儲存的組合
  const handleLoadSaved = async (id: string) => {
    const saved = savedPortfolios.find(p => p.id.toString() === id);
    if (saved && saved.portfolio) {
      onPortfolioChange(saved.portfolio);
      setSelectedSavedId(id);
    }
  };

  // 新增 ETF 到手動組合
  const handleAddEtf = () => {
    if (!newEtfSymbol) return;
    if (portfolio.some(p => p.symbol === newEtfSymbol)) {
      setNewEtfSymbol('');
      return;
    }

    const etf = etfs.find(e => e.symbol === newEtfSymbol);
    if (!etf) return;

    // 計算平均分配權重
    const newCount = portfolio.length + 1;
    const newWeight = 1 / newCount;

    // 重新分配所有權重
    const newPortfolio = portfolio.map(p => ({
      ...p,
      weight: newWeight,
    }));

    newPortfolio.push({
      symbol: newEtfSymbol,
      weight: newWeight,
    });

    onPortfolioChange(newPortfolio);
    setNewEtfSymbol('');
  };

  // 移除 ETF
  const handleRemoveEtf = (symbol: string) => {
    const newPortfolio = portfolio.filter(p => p.symbol !== symbol);
    
    // 重新均分權重
    if (newPortfolio.length > 0) {
      const equalWeight = 1 / newPortfolio.length;
      newPortfolio.forEach(p => {
        p.weight = equalWeight;
      });
    }
    
    onPortfolioChange(newPortfolio);
  };

  // 更新權重
  const handleWeightChange = (symbol: string, value: string) => {
    setWeightInput(prev => ({ ...prev, [symbol]: value }));

    const percent = parseFloat(value);
    if (!isNaN(percent) && percent >= 0 && percent <= 100) {
      const newPortfolio = portfolio.map(p =>
        p.symbol === symbol ? { ...p, weight: percent / 100 } : p
      );
      onPortfolioChange(newPortfolio);
    }
  };

  // 均分權重
  const handleEqualizeWeights = () => {
    if (portfolio.length === 0) return;
    const equalWeight = 1 / portfolio.length;
    const newPortfolio = portfolio.map(p => ({
      ...p,
      weight: equalWeight,
    }));
    onPortfolioChange(newPortfolio);
  };

  // 獲取已使用的 ETF
  const usedSymbols = portfolio.map(p => p.symbol);
  const availableEtfs = etfs.filter(e => !usedSymbols.includes(e.symbol));

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {showSaveLoad && (
        <>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ mb: 2 }}
          >
            <Tab value="manual" label="手動設定" />
            <Tab value="saved" label="載入已儲存組合" />
          </Tabs>

          {activeTab === 'saved' && (
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth>
                <InputLabel>選擇已儲存的組合</InputLabel>
                <Select
                  value={selectedSavedId}
                  onChange={(e) => handleLoadSaved(e.target.value)}
                  label="選擇已儲存的組合"
                >
                  {savedPortfolios.length === 0 && (
                    <MenuItem disabled>無已儲存的組合</MenuItem>
                  )}
                  {savedPortfolios.map((saved) => (
                    <MenuItem key={saved.id} value={saved.id.toString()}>
                      <Box>
                        <Typography variant="body2">{saved.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {saved.portfolio?.length || 0} 檔 ETF · {saved.created_at ? new Date(saved.created_at).toLocaleDateString() : ''}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                載入後會自動切換到手動設定模式調整權重
              </Typography>
            </Box>
          )}
        </>
      )}

      {(!showSaveLoad || activeTab === 'manual') && (
        <Box>
          {/* ETF 選擇 */}
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs>
                <FormControl fullWidth size="small">
                  <InputLabel>選擇 ETF</InputLabel>
                  <Select
                    value={newEtfSymbol}
                    onChange={(e) => setNewEtfSymbol(e.target.value)}
                    label="選擇 ETF"
                    disabled={disabled || portfolio.length >= maxEtfs}
                  >
                    {availableEtfs.length === 0 && (
                      <MenuItem disabled>無可用 ETF</MenuItem>
                    )}
                    {availableEtfs.map((etf) => (
                      <MenuItem key={etf.symbol} value={etf.symbol}>
                        <Box>
                          <Typography variant="body2">{etf.symbol}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {etf.name}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddEtf}
                  disabled={!newEtfSymbol || disabled || portfolio.length >= maxEtfs}
                  size="small"
                >
                  新增
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* 權重顯示和驗證 */}
          {portfolio.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2">
                  權重設定
                </Typography>
                <Button
                  size="small"
                  startIcon={<PieChart />}
                  onClick={handleEqualizeWeights}
                  disabled={disabled}
                >
                  均分
                </Button>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color={isWeightValid ? 'success.main' : 'error.main'}>
                    總權重: {totalWeightPercent}%
                    {isWeightValid ? ' ✓' : ` (需 ${remainingWeight > 0 ? '+' : ''}${remainingWeight}%)`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {portfolio.length} 檔 ETF
                  </Typography>
                </Box>

                {!isWeightValid && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    權重總和必須為 100%，目前為 {totalWeightPercent}%
                  </Alert>
                )}
              </Box>

              {/* ETF 列表和權重調整 */}
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {portfolio.map((holding) => (
                  <Box
                    key={holding.symbol}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1.5,
                      p: 1,
                      bgcolor: 'background.default',
                      borderRadius: 1,
                    }}
                  >
                    <Chip
                      label={holding.symbol}
                      size="small"
                      color="primary"
                      sx={{ minWidth: 60 }}
                    />

                    <Box sx={{ flex: 1 }}>
                      <Slider
                        value={holding.weight * 100}
                        onChange={(_, v) => handleWeightChange(holding.symbol, v.toString())}
                        min={0}
                        max={100}
                        step={1}
                        disabled={disabled}
                        size="small"
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${v}%`}
                      />
                    </Box>

                    <TextField
                      value={weightInput[holding.symbol] || Math.round(holding.weight * 100).toString()}
                      onChange={(e) => handleWeightChange(holding.symbol, e.target.value)}
                      size="small"
                      disabled={disabled}
                      sx={{ width: 70 }}
                      InputProps={{
                        endAdornment: <Typography variant="caption">%</Typography>,
                      }}
                      inputProps={{
                        style: { textAlign: 'right' },
                      }}
                    />

                    <Tooltip title="移除">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveEtf(holding.symbol)}
                        disabled={disabled || portfolio.length <= minEtfs}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Box>

              {portfolio.length < minEtfs && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  至少需要 {minEtfs} 檔 ETF
                </Alert>
              )}
            </>
          )}

          {portfolio.length === 0 && (
            <Alert severity="info">
              請選擇至少 {minEtfs} 檔 ETF
            </Alert>
          )}
        </Box>
      )}
    </Paper>
  );
}
