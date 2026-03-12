import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { dataSyncAPI } from '../services/api';

interface ETFStatus {
  symbol: string;
  name: string;
  latest_date: string | null;
  record_count: number;
  days_since_update: number | null;
}

export default function DataSyncPanel() {
  const [status, setStatus] = useState<ETFStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 載入資料狀態
  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dataSyncAPI.getStatus();
      setStatus(response.status);
    } catch (err: any) {
      setError(err.response?.data?.detail || '載入狀態失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // 執行同步
  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await dataSyncAPI.updatePrices();
      setSyncResult(result);
      setDialogOpen(true);
      // 重新載入狀態
      await loadStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || '同步失敗');
    } finally {
      setSyncing(false);
    }
  };

  // 同步單一 ETF
  const handleSyncSingle = async (symbol: string) => {
    setSyncing(true);
    setError(null);
    try {
      const result = await dataSyncAPI.updateSingleETF(symbol);
      setSyncResult(result);
      setDialogOpen(true);
      await loadStatus();
    } catch (err: any) {
      setError(err.response?.data?.detail || '同步失敗');
    } finally {
      setSyncing(false);
    }
  };

  // 獲取狀態顏色
  const getStatusColor = (days: number | null) => {
    if (days === null) return 'error';
    if (days <= 1) return 'success';
    if (days <= 7) return 'warning';
    return 'error';
  };

  // 獲取狀態圖標
  const getStatusIcon = (days: number | null) => {
    if (days === null) return <WarningIcon color="error" />;
    if (days <= 1) return <CheckIcon color="success" />;
    if (days <= 7) return <WarningIcon color="warning" />;
    return <WarningIcon color="error" />;
  };

  // 獲取狀態文字
  const getStatusText = (days: number | null) => {
    if (days === null) return '無資料';
    if (days === 0) return '今日';
    if (days === 1) return '1天前';
    return `${days}天前`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          ETF 資料同步狀態
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadStatus}
            disabled={loading}
          >
            重新載入
          </Button>
          <Button
            variant="contained"
            startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? '同步中...' : '全部同步'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>狀態</TableCell>
              <TableCell>代碼</TableCell>
              <TableCell>名稱</TableCell>
              <TableCell>最新資料</TableCell>
              <TableCell>資料筆數</TableCell>
              <TableCell>更新時間</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : status.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    無資料
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              status.map((etf) => (
                <TableRow key={etf.symbol}>
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
                  <TableCell>
                    {etf.latest_date || '-'}
                  </TableCell>
                  <TableCell>
                    {etf.record_count.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(etf.days_since_update)}
                      color={getStatusColor(etf.days_since_update) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleSyncSingle(etf.symbol)}
                      disabled={syncing}
                      title="同步此 ETF"
                    >
                      <SyncIcon fontSize="small" />
                    </IconButton>
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
              <Typography variant="body2" gutterBottom>
                訊息: {syncResult.message}
              </Typography>
              {syncResult.total_inserted !== undefined && (
                <Typography variant="body2" gutterBottom>
                  新增資料筆數: {syncResult.total_inserted}
                </Typography>
              )}
              
              {syncResult.messages && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">詳細訊息:</Typography>
                  {syncResult.messages.map((msg: string, idx: number) => (
                    <Typography key={idx} variant="body2" sx={{ fontSize: '0.8rem' }}>
                      • {msg}
                    </Typography>
                  ))}
                </Box>
              )}

              {syncResult.updated && syncResult.updated.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="success.main">
                    成功 ({syncResult.updated.length}):
                  </Typography>
                  {syncResult.updated.map((msg: string, idx: number) => (
                    <Typography key={idx} variant="body2" sx={{ fontSize: '0.8rem' }}>
                      • {msg}
                    </Typography>
                  ))}
                </Box>
              )}

              {syncResult.failed && syncResult.failed.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="error">
                    失敗 ({syncResult.failed.length}):
                  </Typography>
                  {syncResult.failed.map((msg: string, idx: number) => (
                    <Typography key={idx} variant="body2" color="error" sx={{ fontSize: '0.8rem' }}>
                      • {msg}
                    </Typography>
                  ))}
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
