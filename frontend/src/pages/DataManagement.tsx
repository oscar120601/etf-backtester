import { useState } from 'react';
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
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useEffect } from 'react';
import { dataSyncAPI, etfAPI } from '../services/api';
import type { ETF } from '../types';

interface ETFDataStatus {
  symbol: string;
  name: string;
  earliest_date: string | null;
  latest_date: string | null;
  record_count: number;
  days_since_update: number | null;
  data_span_years: number | null;
}

export default function DataManagement() {
  const [, setEtfs] = useState<ETF[]>([]);
  const [dataStatus, setDataStatus] = useState<ETFDataStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingSymbol, setSyncingSymbol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalEtfs: 0,
    totalRecords: 0,
    upToDate: 0,
    outdated: 0,
    noData: 0,
  });

  // 載入 ETF 和資料狀態
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 並行載入 ETF 列表和資料同步狀態
      const [etfsData, syncStatus] = await Promise.all([
        etfAPI.getAll(),
        dataSyncAPI.getStatus(),
      ]);

      setEtfs(etfsData);

      // 為每個 ETF 取得價格統計
      const statusWithDetails: ETFDataStatus[] = await Promise.all(
        etfsData.map(async (etf) => {
          const syncInfo = syncStatus.status.find((s: any) => s.symbol === etf.symbol);
          
          // 獲取該 ETF 的價格範圍
          let earliestDate = null;
          let dataSpanYears = null;
          
          if (syncInfo?.latest_date) {
            try {
              const prices = await etfAPI.getPrices(etf.symbol);
              if (prices.length > 0) {
                const dates = prices.map((p) => new Date(p.date));
                earliestDate = new Date(Math.min(...dates.map((d) => d.getTime()))).toISOString().split('T')[0];
                const latestDate = new Date(Math.max(...dates.map((d) => d.getTime())));
                const earliest = new Date(earliestDate);
                dataSpanYears = (latestDate.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24 * 365);
              }
            } catch (e) {
              console.warn(`Failed to get price range for ${etf.symbol}`);
            }
          }

          return {
            symbol: etf.symbol,
            name: etf.name,
            earliest_date: earliestDate,
            latest_date: syncInfo?.latest_date || null,
            record_count: syncInfo?.record_count || 0,
            days_since_update: syncInfo?.days_since_update || null,
            data_span_years: dataSpanYears,
          };
        })
      );

      setDataStatus(statusWithDetails);

      // 計算統計數據
      const totalRecords = statusWithDetails.reduce((sum, s) => sum + s.record_count, 0);
      const upToDate = statusWithDetails.filter((s) => s.days_since_update !== null && s.days_since_update <= 1).length;
      const outdated = statusWithDetails.filter((s) => s.days_since_update !== null && s.days_since_update > 1).length;
      const noData = statusWithDetails.filter((s) => s.days_since_update === null).length;

      setStats({
        totalEtfs: etfsData.length,
        totalRecords,
        upToDate,
        outdated,
        noData,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || '載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 執行全部同步
  const handleSyncAll = async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await dataSyncAPI.updatePrices();
      setSyncResult(result);
      setDialogOpen(true);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || '同步失敗');
    } finally {
      setSyncing(false);
    }
  };

  // 同步單一 ETF
  const handleSyncSingle = async (symbol: string) => {
    setSyncingSymbol(symbol);
    setError(null);
    try {
      const result = await dataSyncAPI.updateSingleETF(symbol);
      setSyncResult(result);
      setDialogOpen(true);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || '同步失敗');
    } finally {
      setSyncingSymbol(null);
    }
  };

  // 獲取狀態顏色
  const getStatusColor = (days: number | null) => {
    if (days === null) return 'error';
    if (days <= 1) return 'success';
    if (days <= 7) return 'warning';
    return 'error';
  };

  // 獲取狀態文字
  const getStatusText = (days: number | null) => {
    if (days === null) return '無資料';
    if (days === 0) return '今日';
    if (days === 1) return '1天前';
    return `${days}天前`;
  };

  // 獲取狀態圖標
  const getStatusIcon = (days: number | null) => {
    if (days === null) return <WarningIcon color="error" />;
    if (days <= 1) return <CheckIcon color="success" />;
    if (days <= 7) return <WarningIcon color="warning" />;
    return <WarningIcon color="error" />;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        資料管理
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 統計卡片 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography color="text.secondary" variant="body2">
                  ETF 總數
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
                  總資料筆數
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
                  資料最新
                </Typography>
              </Box>
              <Typography variant="h4">{stats.upToDate}</Typography>
              <Typography variant="caption" color="text.secondary">
                1天內更新
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
                超過1天未更新
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 操作按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
          disabled={loading}
        >
          重新載入
        </Button>
        <Button
          variant="contained"
          startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
          onClick={handleSyncAll}
          disabled={syncing}
        >
          {syncing ? '同步中...' : '全部同步'}
        </Button>
      </Box>

      {/* ETF 資料狀態表格 */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={50}>狀態</TableCell>
              <TableCell>代碼</TableCell>
              <TableCell>名稱</TableCell>
              <TableCell align="center">最早資料</TableCell>
              <TableCell align="center">最新資料</TableCell>
              <TableCell align="right">資料筆數</TableCell>
              <TableCell align="right">涵蓋年限</TableCell>
              <TableCell align="center">更新時間</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : dataStatus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    無資料
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              dataStatus.map((etf) => (
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
                  <TableCell align="center">
                    {etf.earliest_date || '-'}
                  </TableCell>
                  <TableCell align="center">
                    {etf.latest_date || '-'}
                  </TableCell>
                  <TableCell align="right">
                    {etf.record_count.toLocaleString()}
                  </TableCell>
                  <TableCell align="right">
                    {etf.data_span_years ? `${etf.data_span_years.toFixed(1)} 年` : '-'}
                  </TableCell>
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

      {/* 同步結果對話框 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>同步結果</DialogTitle>
        <DialogContent>
          {syncResult && (
            <Box>
              <Typography variant="body1" gutterBottom>
                {syncResult.message}
              </Typography>
              
              {syncResult.total_inserted !== undefined && (
                <Typography variant="body2" color="success.main" gutterBottom>
                  新增資料筆數: {syncResult.total_inserted}
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
                    失敗 ({syncResult.failed.length})
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
          <Button onClick={() => setDialogOpen(false)}>關閉</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
