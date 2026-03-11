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
  Assessment as AssessmentIcon,
  Casino as CasinoIcon,
} from '@mui/icons-material'
import ETFList from './pages/ETFList'
import Backtest from './pages/Backtest'
import MonteCarlo from './pages/MonteCarlo'

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

type PageType = 'etfs' | 'backtest' | 'montecarlo';

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('etfs');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case 'etfs': return 'ETF 列表';
      case 'backtest': return '投資組合回測';
      case 'montecarlo': return '蒙地卡羅模擬';
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
            selected={currentPage === 'etfs'}
            onClick={() => {
              setCurrentPage('etfs');
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>
              <AssessmentIcon />
            </ListItemIcon>
            <ListItemText primary="ETF 列表" />
          </ListItemButton>
        </ListItem>
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
            p: 3, 
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            minHeight: '100vh',
            bgcolor: '#f5f5f5'
          }}
        >
          <Toolbar />
          {currentPage === 'etfs' && <ETFList />}
          {currentPage === 'backtest' && <Backtest />}
          {currentPage === 'montecarlo' && <MonteCarlo />}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App
