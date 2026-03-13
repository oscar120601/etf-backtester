import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Casino as CasinoIcon,
  CompareArrows as CompareArrowsIcon,
  Save as SaveIcon,
} from '@mui/icons-material';


interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface MobileNavProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const navItems: NavItem[] = [
  { id: 'etfs', label: 'ETF列表', icon: <AssessmentIcon /> },
  { id: 'backtest', label: '回測', icon: <TrendingUpIcon /> },
  { id: 'montecarlo', label: '模擬', icon: <CasinoIcon /> },
  { id: 'comparison', label: '比較', icon: <CompareArrowsIcon /> },
  { id: 'saved', label: '我的', icon: <SaveIcon /> },
];

/**
 * 桌面版側邊導航
 */
export function DesktopNav({ currentPage, onPageChange }: MobileNavProps) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap>
          ETF Backtester
        </Typography>
      </Toolbar>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentPage === item.id}
              onClick={() => onPageChange(item.id)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

/**
 * 手機版底部導航
 */
export function MobileBottomNav({ currentPage, onPageChange }: MobileNavProps) {
  const value = navItems.findIndex(item => item.id === currentPage);

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: 'block', md: 'none' },
        zIndex: 1000,
      }}
      elevation={3}
    >
      <BottomNavigation
        value={value >= 0 ? value : 0}
        onChange={(_, newValue) => {
          onPageChange(navItems[newValue].id);
        }}
        showLabels
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.id}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}

/**
 * 手機版頂部導航欄
 */
export function MobileTopBar({ 
  title, 
  onMenuClick 
}: { 
  title: string;
  onMenuClick: () => void;
}) {
  return (
    <AppBar
      position="fixed"
      sx={{
        display: { xs: 'block', md: 'none' },
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

/**
 * 響應式導航組件
 */
export default function ResponsiveNav({ 
  currentPage, 
  onPageChange,
  pageTitle 
}: MobileNavProps & { pageTitle: string }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <>
      {/* 桌面版側邊欄 */}
      <DesktopNav currentPage={currentPage} onPageChange={onPageChange} />

      {/* 手機版頂部欄 */}
      <MobileTopBar 
        title={pageTitle} 
        onMenuClick={() => setMobileDrawerOpen(true)} 
      />

      {/* 手機版抽屜導航 */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: 240 },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap>
            ETF Backtester
          </Typography>
        </Toolbar>
        <List>
          {navItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={currentPage === item.id}
                onClick={() => {
                  onPageChange(item.id);
                  setMobileDrawerOpen(false);
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* 手機版底部導航 */}
      <MobileBottomNav currentPage={currentPage} onPageChange={onPageChange} />
    </>
  );
}
