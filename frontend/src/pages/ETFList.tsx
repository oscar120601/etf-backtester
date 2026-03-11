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
} from '@mui/material';
import { etfAPI } from '../services/api';
import type { ETF } from '../types';

const ETFList: React.FC = () => {
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadETFs = async () => {
      try {
        setLoading(true);
        const data = await etfAPI.getAll();
        setEtfs(data);
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
    (etf) =>
      etf.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      etf.name.toLowerCase().includes(searchQuery.toLowerCase())
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
          <TextField
            fullWidth
            label="搜尋 ETF"
            placeholder="輸入代碼或名稱..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" color="text.secondary">
            共找到 {filteredETFs.length} 檔 ETF
          </Typography>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>代碼</TableCell>
              <TableCell>名稱</TableCell>
              <TableCell>資產類別</TableCell>
              <TableCell align="right">費用率</TableCell>
              <TableCell>資產規模</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredETFs.map((etf) => (
              <TableRow key={etf.symbol} hover>
                <TableCell>
                  <Typography fontWeight="bold">{etf.symbol}</Typography>
                </TableCell>
                <TableCell>{etf.name}</TableCell>
                <TableCell>
                  <Chip
                    label={etf.asset_class}
                    color={getAssetClassColor(etf.asset_class)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {etf.expense_ratio
                    ? `${(etf.expense_ratio * 100).toFixed(2)}%`
                    : '-'}
                </TableCell>
                <TableCell>
                  {etf.aum
                    ? `$${(etf.aum / 1000000000).toFixed(1)}B`
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ETFList;
