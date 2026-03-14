import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { dataSyncAPI, etfAPI } from '../services/api';
import type { ETF } from '../types';

interface ETFDataStatus extends ETF {
  earliest_date: string | null;
  latest_date: string | null;
  record_count: number;
  days_since_update: number | null;
  data_span_years: number | null;
}

export default function DataManagement() {
  const [dataStatus, setDataStatus] = useState<ETFDataStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingSymbol, setSyncingSymbol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFactor, setSelectedFactor] = useState<string>('');
  const [viewMode, setViewMode] = useState<'basic' | 'data'>('data');
  
  const [stats, setStats] = useState({
    totalEtfs: 0,
    totalRecords: 0,
    upToDate: 0,
    outdated: 0,
    noData: 0,
  });

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 并行加载 ETF 列表和数据状态
      const [etfsData, syncStatus] = await Promise.all([
        etfAPI.getAll(),
        dataSyncAPI.getStatus(),
      ]);

      // 建立数据状态映射
      const statusMap = new Map(
        syncStatus.status.map((s: any) => [s.symbol, s])
      );

      // 合并 ETF 数据和数据状态
      const mergedData: ETFDataStatus[] = etfsData.map((etf: ETF) => {
        const status = statusMap.get(etf.symbol);
        return {
          ...etf,
          earliest_date: status?.earliest_date || null,
          latest_date: status?.latest_date || null,
          record_count: status?.record_count || 0,
          data_span_years: status?.data_span_years || null,
          days_since_update: status?.days_since_update || null,
        };
      });

      setDataStatus(mergedData);

      // 计算统计数据
      const totalRecords = mergedData.reduce((sum, s) => sum + (s.record_count || 0), 0);
      const upToDate = mergedData.filter((s) => s.days_since_update !== null && s.days_since_update <= 1).length;
      const outdated = mergedData.filter((s) => s.days_since_update !== null && s.days_since_update > 1).length;
      const noData = mergedData.filter((s) => s.days_since_update === null).length;

      setStats({
        totalEtfs: mergedData.length,
        totalRecords,
        upToDate,
        outdated,
        noData,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 执行全部同步
  const handleSyncAll = async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await dataSyncAPI.updatePrices();
      setSyncResult(result);
      setDialogOpen(true);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || '同步失败');
    } finally {
      setSyncing(false);
    }
  };

  // 同步单一 ETF
  const handleSyncSingle = async (symbol: string) => {
    setSyncingSymbol(symbol);
    setError(null);
    try {
      const result = await dataSyncAPI.updateSingleETF(symbol);
      setSyncResult(result);
      setDialogOpen(true);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || '同步失败');
    } finally {
      setSyncingSymbol(null);
    }
  };

  // 筛选 ETF
  const filteredETFs = dataStatus.filter((etf) => {
    const matchesSearch = 
      etf.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      etf.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFactor = 
      !selectedFactor || etf.factor_type === selectedFactor;
    return matchesSearch && matchesFactor;
  });

  // 获取唯一的因子类型列表
  const factorTypes = Array.from(new Set(dataStatus.map(etf => etf.factor_type).filter(Boolean))).sort();

  // 获取状态颜色
  const getStatusColor = (days: number | null) => {
    if (days === null) return 'error';
    if (days <= 1) return 'success';
    if (days <= 7) return 'warning';
    return 'error';
  };

  // 获取状态文字
  const getStatusText = (days: number | null) => {
    if (days === null) return '无资料';
    if (days === 0) return '今日';
    if (days === 1) return '1天前';
    return `${days}天前`;
  };

  // 获取状态图标
  const getStatusIcon = (days: number | null) => {
    if (days === null) return <WarningIcon color="error" />;
    if (days <= 1) return <CheckIcon color="success" />;
    if (days <= 7) return <WarningIcon color="warning" />;
    return <WarningIcon color="error" />;
  };

  // 资产类别颜色映射
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        ETF 资料管理
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 统计卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  ETF 总数
                </Typography>
              </Box>
              <Typography variant="h4">{stats.totalEtfs}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  总资料笔数
                </Typography>
              </Box>
              <Typography variant="h4">{stats.totalRecords.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckIcon color="success" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  资料最新
                </Typography>
              </Box>
              <Typography variant="h4">{stats.upToDate}</Typography>
              <Typography variant="caption" color="text.secondary">
                1天内更新
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarIcon color="info" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  需更新
                </Typography>
              </Box>
              <Typography variant="h4">{stats.outdated + stats.noData}</Typography>
              <Typography variant="caption" color="text.secondary">
                超过1天未更新
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 搜索和筛选 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="搜索 ETF"
                placeholder="输入代码或名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>因子类型</InputLabel>
                <Select
                  value={selectedFactor}
                  label="因子类型"
                  onChange={(e) => setSelectedFactor(e.target.value)}
                >
                  <MenuItem value="">全部</MenuItem>
                  {factorTypes.map((factor) => (
                    <MenuItem key={factor} value={factor}>{factor}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, value) => value && setViewMode(value)}
                fullWidth
              >
                <ToggleButton value="basic">
                  <FilterIcon sx={{ mr: 0.5 }} />
                  基本
                </ToggleButton>
                <ToggleButton value="data">
                  <CalendarIcon sx={{ mr: 0.5 }} />
                  资料周期
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadData}
                  disabled={loading}
                  fullWidth
                >
                  刷新
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              共找到 {filteredETFs.length} 档 ETF
              {searchQuery && ' · 符合搜索条件'}
              {selectedFactor && ` · 因子类型: ${selectedFactor}`}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
              onClick={handleSyncAll}
              disabled={syncing}
            >
              {syncing ? '同步中...' : '全部同步'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ETF 数据状态表格 */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={50}>状态</TableCell>
              <TableCell>代码</TableCell>
              <TableCell>名称</TableCell>
              {viewMode === 'basic' ? (
                <>
                  <TableCell>资产类别</TableCell>
                  <TableCell>因子类型</TableCell>
                  <TableCell align="right">费用率</TableCell>
                </>
              ) : (
                <>
                  <TableCell align="center">最早资料</TableCell>
                  <TableCell align="center">最新资料</TableCell>
                  <TableCell align="right">资料笔数</TableCell>
                  <TableCell align="right">涵盖年限</TableCell>
                </>
              )}
              <TableCell align="center">更新时间</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={viewMode === 'basic' ? 8 : 10} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : filteredETFs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={viewMode === 'basic' ? 8 : 10} align="center">
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    无符合条件的 ETF
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredETFs.map((etf) => (
                <TableRow key={etf.symbol} hover>
                  <TableCell>
                    <Tooltip title={getStatusText(etf.days_since_update)}>
                      {getStatusIcon(etf.days_since_update)}
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {etf.symbol}
                    </Typography>
                  </TableCell>
                  <TableCell>{etf.name}</TableCell>
                  {viewMode === 'basic' ? (
                    <>
                      <TableCell>
                        <Chip
                          label={etf.asset_class}
                          color={getAssetClassColor(etf.asset_class)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {etf.factor_type ? (
                          <Chip label={etf.factor_type} size="small" variant="outlined" />
                        ) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {etf.expense_ratio ? `${(etf.expense_ratio * 100).toFixed(2)}%` : '-'}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell align="center">
                        {etf.earliest_date ? (
                          <Chip
                            label={etf.earliest_date}
                            size="small"
                            variant="outlined"
                            color={etf.data_span_years && etf.data_span_years > 10 ? 'success' : 'default'}
                          />
                        ) : (
                          <Chip label="无资料" size="small" color="error" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {etf.latest_date ? (
                          <Chip label={etf.latest_date} size="small" variant="outlined" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {etf.record_count ? etf.record_count.toLocaleString() : '-'}
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
                  <TableCell align="center">
                    <Chip
                      label={getStatusText(etf.days_since_update)}
                      color={getStatusColor(etf.days_since_update) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={syncingSymbol === etf.symbol ? <CircularProgress size={14} /> : <SyncIcon />}
                      onClick={() => handleSyncSingle(etf.symbol)}
                      disabled={syncing || syncingSymbol === etf.symbol}
                    >
                      同步
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 同步结果对话框 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>同步结果</DialogTitle>
        <DialogContent>
          {syncResult && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {syncResult.message}
              </Typography>
              
              {syncResult.total_inserted !== undefined && (
                <Typography variant="body2" color="success.main" gutterBottom>
                  新增资料笔数: {syncResult.total_inserted}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {syncResult.updated && syncResult.updated.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="success.main">
                    成功 ({syncResult.updated.length})
                  </Typography>
                  <Box sx={{ maxHeight: 150, overflow: 'auto', bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                    {syncResult.updated.map((msg: string, idx: number) => (
                      <Typography key={idx} variant="body2" sx={{ fontSize: '0.8rem' }}>
                        • {msg}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {syncResult.failed && syncResult.failed.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="error">
                    失败 ({syncResult.failed.length})
                  </Typography>
                  <Box sx={{ maxHeight: 150, overflow: 'auto', bgcolor: '#fff3f3', p: 1, borderRadius: 1 }}>
                    {syncResult.failed.map((msg: string, idx: number) => (
                      <Typography key={idx} variant="body2" color="error" sx={{ fontSize: '0.8rem' }}>
                        • {msg}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
