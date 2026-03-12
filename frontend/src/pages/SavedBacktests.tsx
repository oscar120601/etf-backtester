import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { savedBacktestAPI } from '../services/api';
import type { SavedBacktest, PortfolioHolding } from '../types';

// 載入中組件
function LoadingOverlay() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
      <CircularProgress />
    </Box>
  );
}

export default function SavedBacktests() {
  const [backtests, setBacktests] = useState<SavedBacktest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBacktest, setSelectedBacktest] = useState<SavedBacktest | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // 載入已儲存的回測
  const loadBacktests = async () => {
    setLoading(true);
    setError(null);

    try {
      const sessionId = localStorage.getItem('backtest_session_id');
      const response = await savedBacktestAPI.getAll(sessionId || undefined);
      setBacktests(response.items);
    } catch (err) {
      setError('載入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBacktests();
  }, []);

  // 刪除回測
  const handleDelete = async (id: number) => {
    setActionLoading(true);
    try {
      await savedBacktestAPI.delete(id);
      setBacktests(backtests.filter(b => b.id !== id));
      setDeleteConfirmOpen(false);
    } catch (err) {
      setError('刪除失敗，請稍後再試');
    } finally {
      setActionLoading(false);
    }
  };

  // 開啟編輯對話框
  const openEditDialog = (backtest: SavedBacktest) => {
    setSelectedBacktest(backtest);
    setEditName(backtest.name);
    setEditDescription(backtest.description || '');
    setEditDialogOpen(true);
  };

  // 儲存編輯
  const handleEditSave = async () => {
    if (!selectedBacktest) return;

    setActionLoading(true);
    try {
      await savedBacktestAPI.update(selectedBacktest.id, {
        name: editName,
        description: editDescription,
      });
      setBacktests(backtests.map(b =>
        b.id === selectedBacktest.id
          ? { ...b, name: editName, description: editDescription }
          : b
      ));
      setEditDialogOpen(false);
    } catch (err) {
      setError('更新失敗，請稍後再試');
    } finally {
      setActionLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW');
  };

  // 格式化百分比
  const formatPercent = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return `${(value * 100).toFixed(2)}%`;
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          我的回測
        </Typography>
        <Button variant="outlined" onClick={loadBacktests}>
          重新載入
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {backtests.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary" gutterBottom>
              還沒有儲存的回測
            </Typography>
            <Typography variant="body2" color="text.secondary">
              在回測頁面執行回測後，點擊「儲存回測」按鈕即可在此查看
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {backtests.map((backtest) => (
            <Grid item xs={12} md={6} lg={4} key={backtest.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ flex: 1, mr: 1 }}>
                      {backtest.name}
                    </Typography>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="編輯">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(backtest)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="刪除">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedBacktest(backtest);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {backtest.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {backtest.description}
                    </Typography>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      投資組合
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {backtest.portfolio?.map((h: PortfolioHolding) => (
                        <Chip
                          key={h.symbol}
                          label={`${h.symbol} ${(h.weight * 100).toFixed(0)}%`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        期間
                      </Typography>
                      <Typography variant="body2">
                        {backtest.start_date} ~ {backtest.end_date}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        總報酬
                      </Typography>
                      <Typography
                        variant="body1"
                        color={backtest.total_return && backtest.total_return >= 0 ? 'success.main' : 'error.main'}
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        {backtest.total_return && backtest.total_return >= 0 ? (
                          <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                        ) : (
                          <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                        )}
                        {formatPercent(backtest.total_return)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        CAGR
                      </Typography>
                      <Typography variant="body1">
                        {formatPercent(backtest.cagr)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        最大回撤
                      </Typography>
                      <Typography variant="body1" color="error.main">
                        {formatPercent(backtest.max_drawdown)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      儲存時間: {formatDate(backtest.created_at)}
                    </Typography>
                    <Chip
                      label={`夏普: ${backtest.sharpe_ratio?.toFixed(2) || '-'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 編輯對話框 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>編輯回測</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="名稱"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            disabled={actionLoading}
          />
          <TextField
            margin="dense"
            label="描述"
            fullWidth
            multiline
            rows={2}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            disabled={actionLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={actionLoading}>
            取消
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={actionLoading}
          >
            儲存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 刪除確認對話框 */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除「{selectedBacktest?.name}」嗎？此操作無法復原。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={actionLoading}>
            取消
          </Button>
          <Button
            onClick={() => selectedBacktest && handleDelete(selectedBacktest.id)}
            color="error"
            disabled={actionLoading}
          >
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
