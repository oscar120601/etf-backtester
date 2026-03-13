import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Button,
  Chip,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { ETF } from '../types/etf';

interface Holding {
  symbol: string;
  weight: number;
}

interface ETFSelectorProps {
  selectedETFs: Holding[];
  onChange: (holdings: Holding[]) => void;
  availableETFs: ETF[];
}

export default function ETFSelector({ selectedETFs, onChange, availableETFs }: ETFSelectorProps) {
  const totalWeight = selectedETFs.reduce((sum, h) => sum + h.weight, 0);

  const addETF = () => {
    if (availableETFs.length === 0) return;
    
    // 找到第一個尚未選擇的 ETF
    const usedSymbols = new Set(selectedETFs.map(h => h.symbol));
    const availableETF = availableETFs.find(etf => !usedSymbols.has(etf.symbol));
    
    if (availableETF) {
      onChange([...selectedETFs, { symbol: availableETF.symbol, weight: 0 }]);
    }
  };

  const removeETF = (index: number) => {
    const newHoldings = [...selectedETFs];
    newHoldings.splice(index, 1);
    onChange(newHoldings);
  };

  const updateETF = (index: number, field: 'symbol' | 'weight', value: string | number) => {
    const newHoldings = [...selectedETFs];
    if (field === 'symbol') {
      newHoldings[index].symbol = value as string;
    } else {
      newHoldings[index].weight = typeof value === 'string' ? parseFloat(value) / 100 : value;
    }
    onChange(newHoldings);
  };

  const getETFName = (symbol: string) => {
    const etf = availableETFs.find(e => e.symbol === symbol);
    return etf ? etf.name : symbol;
  };

  // 獲取已使用的 ETF 代碼
  const usedSymbols = new Set(selectedETFs.map(h => h.symbol));

  return (
    <Box>
      {selectedETFs.map((holding, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ flexGrow: 1 }}>
            <InputLabel>ETF</InputLabel>
            <Select
              value={holding.symbol}
              label="ETF"
              onChange={(e) => updateETF(index, 'symbol', e.target.value)}
            >
              {availableETFs.map((etf) => (
                <MenuItem 
                  key={etf.symbol} 
                  value={etf.symbol}
                  disabled={usedSymbols.has(etf.symbol) && etf.symbol !== holding.symbol}
                >
                  {etf.symbol} - {etf.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            label="權重 %"
            type="number"
            size="small"
            value={(holding.weight * 100).toFixed(0)}
            onChange={(e) => updateETF(index, 'weight', e.target.value)}
            sx={{ width: 100 }}
            inputProps={{ min: 0, max: 100 }}
          />
          
          <Tooltip title={getETFName(holding.symbol)}>
            <Chip 
              label={holding.symbol} 
              size="small" 
              sx={{ minWidth: 60 }}
            />
          </Tooltip>
          
          <IconButton 
            size="small" 
            onClick={() => removeETF(index)}
            disabled={selectedETFs.length <= 1}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ))}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={addETF}
          disabled={selectedETFs.length >= availableETFs.length}
        >
          新增 ETF
        </Button>
        
        <Chip
          label={`總計: ${(totalWeight * 100).toFixed(1)}%`}
          color={Math.abs(totalWeight - 1.0) < 0.001 ? 'success' : 'warning'}
          size="small"
        />
      </Box>
      
      {Math.abs(totalWeight - 1.0) > 0.001 && (
        <Box sx={{ mt: 1, fontSize: '0.75rem', color: 'warning.main' }}>
          權重總和必須為 100%，目前為 {(totalWeight * 100).toFixed(1)}%
        </Box>
      )}
    </Box>
  );
}
