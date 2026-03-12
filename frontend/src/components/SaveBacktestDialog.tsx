import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { savedBacktestAPI } from '../services/api';
import type { BacktestResponse, BacktestParameters, PortfolioHolding } from '../types';

interface SaveBacktestDialogProps {
  portfolio: PortfolioHolding[];
  parameters: BacktestParameters;
  result: BacktestResponse;
  disabled?: boolean;
  onSaved?: () => void;
}

export default function SaveBacktestDialog({
  portfolio,
  parameters,
  result,
  disabled,
  onSaved,
}: SaveBacktestDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleOpen = () => {
    // 預設名稱
    const dateStr = new Date().toISOString().split('T')[0];
    const holdingsStr = portfolio.map(h => h.symbol).join('+');
    setName(`${holdingsStr} (${dateStr})`);
    setDescription('');
    setError(null);
    setSuccess(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    if (success && onSaved) {
      onSaved();
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('請輸入名稱');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 獲取或生成 session_id
      let sessionId = localStorage.getItem('backtest_session_id');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('backtest_session_id', sessionId);
      }

      await savedBacktestAPI.create({
        name: name.trim(),
        description: description.trim() || undefined,
        session_id: sessionId,
        portfolio,
        parameters,
        result,
      });

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || '儲存失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<SaveIcon />}
        onClick={handleOpen}
        disabled={disabled || !result}
      >
        儲存回測
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>儲存回測結果</DialogTitle>
        <DialogContent>
          {success ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              回測結果已成功儲存！
            </Alert>
          ) : (
            <>
              <Box sx={{ mb: 2, mt: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  投資組合
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {portfolio.map((h) => (
                    <Typography key={h.symbol} variant="body2" component="span">
                      {h.symbol} ({(h.weight * 100).toFixed(0)}%)
                    </Typography>
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  回測期間
                </Typography>
                <Typography variant="body2">
                  {parameters.start_date} ~ {parameters.end_date}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  績效摘要
                </Typography>
                <Typography variant="body2">
                  總報酬: {(result.metrics.total_return * 100).toFixed(2)}% | 
                  CAGR: {(result.metrics.cagr * 100).toFixed(2)}% | 
                  最大回撤: {(result.metrics.max_drawdown * 100).toFixed(2)}%
                </Typography>
              </Box>

              <TextField
                autoFocus
                margin="dense"
                label="名稱"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />

              <TextField
                margin="dense"
                label="描述（可選）"
                fullWidth
                multiline
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            {success ? '關閉' : '取消'}
          </Button>
          {!success && (
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={loading}
              startIcon={loading && <CircularProgress size={16} />}
            >
              {loading ? '儲存中...' : '儲存'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
