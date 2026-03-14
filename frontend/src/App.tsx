import { useState } from 'react'
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@mui/material'
import {
  Menu as MenuIcon,
  TrendingUp as TrendingUpIcon,
  Casino as CasinoIcon,
  CompareArrows as CompareArrowsIcon,
  Save as SaveIcon,
  AutoGraph as AutoGraphIcon,
  BarChart as BarChartIcon,
  Warning as WarningIcon,
  Storage as StorageIcon,
} from '@mui/icons-material'
import Backtest from './pages/Backtest'
import MonteCarlo from './pages/MonteCarlo'
import Comparison from './pages/Comparison'
import SavedBacktests from './pages/SavedBacktests'
import Optimizer from './pages/Optimizer'
import Analysis from './pages/Analysis'
import StressTest from './pages/StressTest'
import DataManagement from './pages/DataManagement'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const DRAWER_WIDTH = 240;

type PageType = 'backtest' | 'montecarlo' | 'comparison' | 'saved' | 'optimizer' | 'analysis' | 'stresstest' | 'datamgmt';

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('backtest');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getPageTitle = () => {
    switch (currentPage) {

      case 'backtest': return '投資組合回測';
      case 'montecarlo': return '蒙地卡羅模擬';
      case 'comparison': return '投資組合比較';
      case 'saved': return '我的回測';
      case 'optimizer': return '投資組合優化器';
      case 'analysis': return '投資分析工具';
      case 'stresstest': return '壓力測試';
      case 'datamgmt': return '資料管理';
      default: return 'ETF Backtester';
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          ETF Backtester
        </Typography>
      </Toolbar>
      <List>
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentPage === 'backtest'}
            onClick={() => {
              setCurrentPage('backtest');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              <TrendingUpIcon />
            </ListItemIcon>
            <ListItemText primary="投資組合回測" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentPage === 'montecarlo'}
            onClick={() => {
              setCurrentPage('montecarlo');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              <CasinoIcon />
            </ListItemIcon>
            <ListItemText primary="蒙地卡羅模擬" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentPage === 'comparison'}
            onClick={() => {
              setCurrentPage('comparison');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              <CompareArrowsIcon />
            </ListItemIcon>
            <ListItemText primary="組合比較" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentPage === 'saved'}
            onClick={() => {
              setCurrentPage('saved');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              <SaveIcon />
            </ListItemIcon>
            <ListItemText primary="我的回測" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentPage === 'optimizer'}
            onClick={() => {
              setCurrentPage('optimizer');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              <AutoGraphIcon />
            </ListItemIcon>
            <ListItemText primary="組合優化器" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentPage === 'analysis'}
            onClick={() => {
              setCurrentPage('analysis');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              <BarChartIcon />
            </ListItemIcon>
            <ListItemText primary="投資分析" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentPage === 'stresstest'}
            onClick={() => {
              setCurrentPage('stresstest');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              <WarningIcon />
            </ListItemIcon>
            <ListItemText primary="壓力測試" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentPage === 'datamgmt'}
            onClick={() => {
              setCurrentPage('datamgmt');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              <StorageIcon />
            </ListItemIcon>
            <ListItemText primary="資料管理" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            ml: { sm: `${DRAWER_WIDTH}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              {getPageTitle()}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Box
          component="nav"
          sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
            }}
          >
            {drawer}
          </Drawer>
          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main content */}
        <Box
          component="main"
          sx={{ 
            flexGrow: 1, 
            p: { xs: 2, sm: 3 },
            pt: { xs: 10, sm: 3 },  // 手機版頂部留白給 AppBar
            pb: { xs: 10, sm: 3 },  // 手機版底部留白給 BottomNav
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            minHeight: '100vh',
            bgcolor: '#f5f5f5',
            overflowX: 'hidden',
          }}
        >
          <Toolbar sx={{ display: { xs: 'none', sm: 'block' } }} />
          {currentPage === 'backtest' && <Backtest />}
          {currentPage === 'montecarlo' && <MonteCarlo />}
          {currentPage === 'comparison' && <Comparison />}
          {currentPage === 'saved' && <SavedBacktests />}
          {currentPage === 'optimizer' && <Optimizer />}
          {currentPage === 'analysis' && <Analysis />}
          {currentPage === 'stresstest' && <StressTest />}
          {currentPage === 'datamgmt' && <DataManagement />}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App
