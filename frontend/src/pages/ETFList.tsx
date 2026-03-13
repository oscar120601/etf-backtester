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
} from '@mui/material';
import { etfAPI } from '../services/api';
import type { ETF } from '../types';

const ETFList: React.FC = () => {
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFactor, setSelectedFactor] = useState<string>('');

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
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="搜尋 ETF"
                placeholder="輸入代碼或名稱..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
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
          </Grid>

          <Typography variant="body2" color="text.secondary">
            共找到 {filteredETFs.length} 檔 ETF
          </Typography>
        </CardContent>
      </Card>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell>代碼</TableCell>
              <TableCell>名稱</TableCell>
              <TableCell>資產類別</TableCell>
              <TableCell>因子類型</TableCell>
              <TableCell align="right">費用率</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>資產規模</TableCell>
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
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
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
