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
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Typography,
  Alert,
  Chip,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FolderOpen as LoadIcon,
  Download as ExportIcon,
  Upload as ImportIcon,
} from '@mui/icons-material';
import {
  SavedPortfolio,
  getSavedPortfolios,
  savePortfolio,
  deletePortfolio,
  updatePortfolio,
  exportPortfoliosToJSON,
  importPortfoliosFromJSON,
} from '../utils/portfolioStorage';

interface SavedPortfoliosManagerProps {
  currentHoldings: Array<{ symbol: string; weight: number }>;
  onLoadPortfolio: (holdings: Array<{ symbol: string; weight: number }>) => void;
}

export default function SavedPortfoliosManager({
  currentHoldings,
  onLoadPortfolio,
}: SavedPortfoliosManagerProps) {
  const [open, setOpen] = useState(false);
  const [portfolios, setPortfolios] = useState<SavedPortfolio[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<SavedPortfolio | null>(null);
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState('');

  // 載入儲存的投資組合
  useEffect(() => {
    if (open) {
      setPortfolios(getSavedPortfolios());
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
  const handleSave = () => {
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

    const newPortfolio = savePortfolio(
      portfolioName.trim(),
      currentHoldings,
      portfolioDescription.trim()
    );

    setPortfolios([...portfolios, newPortfolio]);
    setSaveDialogOpen(false);
    setPortfolioName('');
    setPortfolioDescription('');
    setMessage({ type: 'success', text: `投資組合「${newPortfolio.name}」已儲存` });
  };

  // 載入投資組合
  const handleLoad = (portfolio: SavedPortfolio) => {
    onLoadPortfolio(portfolio.holdings);
    setMessage({ type: 'success', text: `已載入「${portfolio.name}」` });
    setTimeout(() => {
      handleClose();
      setMessage(null);
    }, 1000);
  };

  // 刪除投資組合
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`確定要刪除投資組合「${name}」嗎？`)) {
      deletePortfolio(id);
      setPortfolios(portfolios.filter((p) => p.id !== id));
      setMessage({ type: 'success', text: `投資組合「${name}」已刪除` });
    }
  };

  // 編輯投資組合
  const handleEdit = (portfolio: SavedPortfolio) => {
    setSelectedPortfolio(portfolio);
    setPortfolioName(portfolio.name);
    setPortfolioDescription(portfolio.description || '');
    setEditDialogOpen(true);
    setMessage(null);
  };

  // 更新投資組合
  const handleUpdate = () => {
    if (!selectedPortfolio || !portfolioName.trim()) return;

    updatePortfolio(selectedPortfolio.id, {
      name: portfolioName.trim(),
      description: portfolioDescription.trim(),
    });

    setPortfolios(getSavedPortfolios());
    setEditDialogOpen(false);
    setSelectedPortfolio(null);
    setPortfolioName('');
    setPortfolioDescription('');
    setMessage({ type: 'success', text: '投資組合已更新' });
  };

  // 匯出所有投資組合
  const handleExport = () => {
    const data = exportPortfoliosToJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saved_portfolios_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMessage({ type: 'success', text: '投資組合已匯出' });
  };

  // 匯入投資組合
  const handleImport = () => {
    try {
      if (!importData.trim()) {
        setMessage({ type: 'error', text: '請輸入 JSON 數據' });
        return;
      }

      if (importPortfoliosFromJSON(importData)) {
        setPortfolios(getSavedPortfolios());
        setImportDialogOpen(false);
        setImportData('');
        setMessage({ type: 'success', text: '投資組合已匯入' });
      } else {
        setMessage({ type: 'error', text: '匯入失敗，請檢查 JSON 格式' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '匯入失敗，請檢查 JSON 格式' });
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<SaveIcon />}
        onClick={handleOpen}
        size="small"
      >
        管理投資組合 ({portfolios.length})
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            投資組合管理
            <Box>
              <Tooltip title="匯出所有投資組合">
                <IconButton onClick={handleExport} size="small">
                  <ExportIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="匯入投資組合">
                <IconButton onClick={() => setImportDialogOpen(true)} size="small">
                  <ImportIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => {
                setSaveDialogOpen(true);
                setPortfolioName('');
                setPortfolioDescription('');
                setMessage(null);
              }}
              fullWidth
            >
              儲存當前投資組合
            </Button>
          </Box>

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            已儲存的投資組合 ({portfolios.length})
          </Typography>

          {portfolios.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              尚無儲存的投資組合
            </Typography>
          ) : (
            <List dense>
              {portfolios.map((portfolio) => (
                <ListItem
                  key={portfolio.id}
                  disablePadding
                  secondaryAction={
                    <Box>
                      <Tooltip title="載入">
                        <IconButton
                          edge="end"
                          onClick={() => handleLoad(portfolio)}
                          size="small"
                        >
                          <LoadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="編輯">
                        <IconButton
                          edge="end"
                          onClick={() => handleEdit(portfolio)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="刪除">
                        <IconButton
                          edge="end"
                          onClick={() => handleDelete(portfolio.id, portfolio.name)}
                          size="small"
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
                            label={`${portfolio.holdings.length} 檔`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          {portfolio.description && (
                            <Typography variant="caption" component="div">
                              {portfolio.description}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            更新於 {formatDate(portfolio.updatedAt)}
                          </Typography>
                        </>
                      }
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
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>儲存投資組合</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="名稱"
            fullWidth
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
            placeholder="例如：我的退休組合"
          />
          <TextField
            margin="dense"
            label="描述（選填）"
            fullWidth
            multiline
            rows={2}
            value={portfolioDescription}
            onChange={(e) => setPortfolioDescription(e.target.value)}
            placeholder="簡短描述這個投資組合的策略..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>取消</Button>
          <Button onClick={handleSave} variant="contained">
            儲存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編輯對話框 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>編輯投資組合</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="名稱"
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
          <Button onClick={handleUpdate} variant="contained">
            更新
          </Button>
        </DialogActions>
      </Dialog>

      {/* 匯入對話框 */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>匯入投資組合</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            請貼上之前匯出的 JSON 數據：
          </Typography>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder='[{&quot;id&quot;: &quot;...&quot;, &quot;name&quot;: &quot;...&quot;, ...}]'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>取消</Button>
          <Button onClick={handleImport} variant="contained">
            匯入
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
