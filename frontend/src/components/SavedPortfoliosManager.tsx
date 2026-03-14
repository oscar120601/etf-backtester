import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  TextField,
  Typography,
  Alert,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FolderOpen as LoadIcon,
} from '@mui/icons-material';
import { savedBacktestAPI } from '../services/api';
import type { SavedBacktest } from '../types';

interface SavedPortfoliosManagerProps {
  currentHoldings: Array<{ symbol: string; weight: number }>;
  onLoadPortfolio: (holdings: Array<{ symbol: string; weight: number }>) => void;
}

export default function SavedPortfoliosManager({
  currentHoldings,
  onLoadPortfolio,
}: SavedPortfoliosManagerProps) {
  const [open, setOpen] = useState(false);
  const [portfolios, setPortfolios] = useState<SavedBacktest[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<SavedBacktest | null>(null);
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


  // 載入儲存的投資組合（從後端 API）
  const loadPortfolios = async () => {
    setLoading(true);
    try {
      const response = await savedBacktestAPI.getAll();
      setPortfolios(response.items || []);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
      setMessage({ type: 'error', text: '載入投資組合失敗' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadPortfolios();
    }
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
    setMessage(null);
  };

  const handleClose = () => {
    setOpen(false);
    setMessage(null);
  };

  // 儲存新投資組合
  const handleSave = async () => {
    if (!portfolioName.trim()) {
      setMessage({ type: 'error', text: '請輸入投資組合名稱' });
      return;
    }

    // 檢查權重總和是否為 100%
    const totalWeight = currentHoldings.reduce((sum, h) => sum + h.weight, 0);
    if (Math.abs(totalWeight - 1) > 0.001) {
      setMessage({ type: 'error', text: '權重總和必須為 100% 才能儲存' });
      return;
    }

    setLoading(true);
    try {
      // 注意：savedBacktestAPI 需要回測結果才能儲存
      // 這裡我們創建一個簡化的儲存，使用當前 holdings
      await savedBacktestAPI.create({
        name: portfolioName.trim(),
        description: portfolioDescription.trim() || undefined,
        portfolio: currentHoldings,
        parameters: {
          start_date: '2020-01-01',
          end_date: '2024-12-31',
          initial_amount: 10000,
          rebalance_frequency: 'yearly',
          reinvest_dividends: true,
        },
      });

      await loadPortfolios();
      setSaveDialogOpen(false);
      setPortfolioName('');
      setPortfolioDescription('');
      setMessage({ type: 'success', text: `投資組合「${portfolioName.trim()}」已儲存` });
    } catch (error) {
      console.error('Failed to save portfolio:', error);
      setMessage({ type: 'error', text: '儲存投資組合失敗' });
    } finally {
      setLoading(false);
    }
  };

  // 載入投資組合
  const handleLoad = (portfolio: SavedBacktest) => {
    if (portfolio.portfolio && portfolio.portfolio.length > 0) {
      onLoadPortfolio(portfolio.portfolio);
      setMessage({ type: 'success', text: `已載入「${portfolio.name}」` });
      setTimeout(() => {
        handleClose();
        setMessage(null);
      }, 1000);
    } else {
      setMessage({ type: 'error', text: '投資組合資料不完整' });
    }
  };

  // 刪除投資組合
  const handleDelete = async (id: number) => {
    if (!window.confirm('確定要刪除此投資組合嗎？')) return;

    setLoading(true);
    try {
      await savedBacktestAPI.delete(id);
      await loadPortfolios();
      setMessage({ type: 'success', text: '投資組合已刪除' });
    } catch (error) {
      console.error('Failed to delete portfolio:', error);
      setMessage({ type: 'error', text: '刪除投資組合失敗' });
    } finally {
      setLoading(false);
    }
  };

  // 開啟編輯對話框
  const openEditDialog = (portfolio: SavedBacktest) => {
    setSelectedPortfolio(portfolio);
    setPortfolioName(portfolio.name);
    setPortfolioDescription(portfolio.description || '');
    setEditDialogOpen(true);
    setMessage(null);
  };

  // 更新投資組合
  const handleUpdate = async () => {
    if (!selectedPortfolio || !portfolioName.trim()) {
      setMessage({ type: 'error', text: '請輸入投資組合名稱' });
      return;
    }

    setLoading(true);
    try {
      await savedBacktestAPI.update(selectedPortfolio.id, {
        name: portfolioName.trim(),
        description: portfolioDescription.trim() || undefined,
      });
      await loadPortfolios();
      setEditDialogOpen(false);
      setPortfolioName('');
      setPortfolioDescription('');
      setSelectedPortfolio(null);
      setMessage({ type: 'success', text: '投資組合已更新' });
    } catch (error) {
      console.error('Failed to update portfolio:', error);
      setMessage({ type: 'error', text: '更新投資組合失敗' });
    } finally {
      setLoading(false);
    }
  };

  // 開啟儲存對話框
  const openSaveDialog = () => {
    setPortfolioName(`投資組合 ${new Date().toLocaleDateString()}`);
    setPortfolioDescription('');
    setSaveDialogOpen(true);
    setMessage(null);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<LoadIcon />}
        onClick={handleOpen}
        size="small"
      >
        管理投資組合 ({portfolios.length})
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>投資組合管理</DialogTitle>
        <DialogContent>
          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SaveIcon />}
              onClick={openSaveDialog}
              disabled={loading}
            >
              儲存當前投資組合
            </Button>
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            已儲存的投資組合 ({portfolios.length})
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : portfolios.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
              尚無儲存的投資組合
            </Typography>
          ) : (
            <List>
              {portfolios.map((portfolio) => (
                <ListItem
                  key={portfolio.id}
                  secondaryAction={
                    <Box>
                      <Tooltip title="載入">
                        <IconButton
                          edge="end"
                          onClick={() => handleLoad(portfolio)}
                          disabled={loading}
                        >
                          <LoadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="編輯">
                        <IconButton
                          edge="end"
                          onClick={() => openEditDialog(portfolio)}
                          disabled={loading}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="刪除">
                        <IconButton
                          edge="end"
                          onClick={() => handleDelete(portfolio.id)}
                          disabled={loading}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemButton onClick={() => handleLoad(portfolio)}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {portfolio.name}
                          <Chip
                            label={`${portfolio.portfolio?.length || 0} 檔`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={`更新於 ${formatDate(portfolio.created_at)}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>關閉</Button>
        </DialogActions>
      </Dialog>

      {/* 儲存對話框 */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>儲存投資組合</DialogTitle>
        <DialogContent>
          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="投資組合名稱"
            fullWidth
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="描述（選填）"
            fullWidth
            multiline
            rows={2}
            value={portfolioDescription}
            onChange={(e) => setPortfolioDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>取消</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : '儲存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編輯對話框 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>編輯投資組合</DialogTitle>
        <DialogContent>
          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="投資組合名稱"
            fullWidth
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="描述（選填）"
            fullWidth
            multiline
            rows={2}
            value={portfolioDescription}
            onChange={(e) => setPortfolioDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={handleUpdate} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : '更新'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
