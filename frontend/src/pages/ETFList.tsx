import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { etfAPI, dataSyncAPI } from '../services/api';
import type { ETF } from '../types';

interface ETFWithDataStatus extends ETF {
  earliest_date?: string | null;
  latest_date?: string | null;
  record_count?: number;
  data_span_years?: number | null;
}

const ETFList: React.FC = () => {
  const [etfs, setEtfs] = useState<ETFWithDataStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFactor, setSelectedFactor] = useState<string>('');
  const [showDataInfo, setShowDataInfo] = useState(true);

  useEffect(() => {
    const loadETFs = async () => {
      try {
        setLoading(true);
        
        // 並行載入 ETF 列表和資料狀態
        const [etfsData, dataStatus] = await Promise.all([
          etfAPI.getAll(),
          dataSyncAPI.getStatus().catch(() => ({ status: [] })), // 如果失敗則返回空狀態
        ]);

        // 建立資料狀態映射
        const statusMap = new Map(
          dataStatus.status.map((s: any) => [s.symbol, s])
        );

        // 為每個 ETF 獲取價格範圍
        const etfsWithData: ETFWithDataStatus[] = await Promise.all(
          etfsData.map(async (etf) => {
            const status = statusMap.get(etf.symbol);
            
            if (status?.latest_date) {
              try {
                const prices = await etfAPI.getPrices(etf.symbol);
                if (prices.length > 0) {
                  const dates = prices.map((p) => new Date(p.date).getTime());
                  const earliest = new Date(Math.min(...dates));
                  const latest = new Date(Math.max(...dates));
                  const years = (latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24 * 365);
                  
                  return {
                    ...etf,
                    earliest_date: earliest.toISOString().split('T')[0],
                    latest_date: latest.toISOString().split('T')[0],
                    record_count: prices.length,
                    data_span_years: years,
                  };
                }
              } catch (e) {
                console.warn(`Failed to get prices for ${etf.symbol}`);
              }
            }

            // 如果沒有價格資料，只使用基本狀態
            return {
              ...etf,
              earliest_date: null,
              latest_date: status?.latest_date || null,
              record_count: status?.record_count || 0,
              data_span_years: null,
            };
          })
        );

        setEtfs(etfsWithData);
        setError(null);
      } catch (err) {
        console.error('Failed to load ETFs:', err);
        setError('無法載入 ETF 列表，請確認後端服務是否運行中');
      } finally {
        setLoading(false);
      }
    };

    loadETFs();
  }, []);

  // 過濾 ETF
  const filteredETFs = etfs.filter(
    (etf) => {
      const matchesSearch = 
        etf.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        etf.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFactor = 
        !selectedFactor || etf.factor_type === selectedFactor;
      return matchesSearch && matchesFactor;
    }
  );

  // 資產類別顏色映射
  const getAssetClassColor = (assetClass?: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning'> = {
      'Equity': 'primary',
      'Bond': 'success',
      'Real Estate': 'warning',
      'Commodity': 'error',
      'Multi-Asset': 'info',
    };
    return assetClass ? colors[assetClass] || 'default' : 'default';
  };

  // 獲取唯一的因子類型列表
  const factorTypes = Array.from(new Set(etfs.map(etf => etf.factor_type).filter(Boolean))).sort();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ETF 列表
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="搜尋 ETF"
                placeholder="輸入代碼或名稱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>因子類型</InputLabel>
                <Select
                  value={selectedFactor}
                  label="因子類型"
                  onChange={(e) => setSelectedFactor(e.target.value)}
                >
                  <MenuItem value="">全部</MenuItem>
                  {factorTypes.map((factor) => (
                    <MenuItem key={factor} value={factor}>
                      {factor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>顯示資訊</InputLabel>
                <Select
                  value={showDataInfo ? 'data' : 'basic'}
                  label="顯示資訊"
                  onChange={(e) => setShowDataInfo(e.target.value === 'data')}
                >
                  <MenuItem value="basic">基本資訊</MenuItem>
                  <MenuItem value="data">包含資料週期</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary">
            共找到 {filteredETFs.length} 檔 ETF
            {showDataInfo && ' • 顯示資料週期資訊'}
          </Typography>
        </CardContent>
      </Card>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow>
              <TableCell>代碼</TableCell>
              <TableCell>名稱</TableCell>
              <TableCell>資產類別</TableCell>
              <TableCell>因子類型</TableCell>
              <TableCell align="right">費用率</TableCell>
              {showDataInfo && (
                <>
                  <TableCell align="center">
                    <Tooltip title="最早資料日期">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <CalendarIcon fontSize="small" />
                        起始
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="最新資料日期">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <TrendingUpIcon fontSize="small" />
                        最新
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="資料筆數">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <StorageIcon fontSize="small" />
                        筆數
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">涵蓋年限</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredETFs.map((etf) => (
              <TableRow key={etf.symbol} hover>
                <TableCell>
                  <Typography fontWeight="bold">{etf.symbol}</Typography>
                </TableCell>
                <TableCell sx={{ minWidth: 150 }}>{etf.name}</TableCell>
                <TableCell>
                  <Chip
                    label={etf.asset_class}
                    color={getAssetClassColor(etf.asset_class)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {etf.factor_type ? (
                    <Chip
                      label={etf.factor_type}
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell align="right">
                  {etf.expense_ratio
                    ? `${(etf.expense_ratio * 100).toFixed(2)}%`
                    : '-'}
                </TableCell>
                {showDataInfo && (
                  <>
                    <TableCell align="center">
                      {etf.earliest_date ? (
                        <Tooltip title={`資料起始於 ${etf.earliest_date}`}>
                          <Chip
                            label={etf.earliest_date}
                            size="small"
                            variant="outlined"
                            color={etf.data_span_years && etf.data_span_years > 10 ? 'success' : 'default'}
                          />
                        </Tooltip>
                      ) : (
                        <Chip label="無資料" size="small" color="error" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {etf.latest_date ? (
                        <Chip
                          label={etf.latest_date}
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {etf.record_count ? (
                        <Typography variant="body2">
                          {etf.record_count.toLocaleString()}
                        </Typography>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {etf.data_span_years ? (
                        <Chip
                          label={`${etf.data_span_years.toFixed(1)} 年`}
                          size="small"
                          color={etf.data_span_years > 20 ? 'success' : etf.data_span_years > 10 ? 'info' : 'warning'}
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ETFList;
