import { ReactNode } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

interface ResponsiveLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  maxWidth?: number | string;
}

/**
 * 響應式佈局組件
 * 
 * 桌面版：側邊欄 + 主內容區
 * 手機版：單欄佈局，側邊欄移到頂部或隱藏
 */
export default function ResponsiveLayout({ 
  children, 
  sidebar,
  maxWidth = 1400 
}: ResponsiveLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 2,
        maxWidth,
        mx: 'auto',
        p: { xs: 1, sm: 2, md: 3 },
      }}
    >
      {/* 側邊欄 - 手機版全寬 */}
      {sidebar && (
        <Box
          sx={{
            width: { xs: '100%', md: 320, lg: 360 },
            flexShrink: 0,
          }}
        >
          {sidebar}
        </Box>
      )}

      {/* 主內容區 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}

/**
 * 響應式網格組件
 * 
 * 根據螢幕尺寸自動調整欄數
 */
export function ResponsiveGrid({ 
  children,
  spacing = 2 
}: { 
  children: ReactNode;
  spacing?: number;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
        gap: spacing,
      }}
    >
      {children}
    </Box>
  );
}

/**
 * 響應式表單欄位
 * 
 * 桌面版：兩欄佈局
 * 手機版：單欄佈局
 */
export function ResponsiveForm({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(2, 1fr)',
        },
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

/**
 * 響應式紙張/卡片內距
 */
export function ResponsivePadding({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        p: { xs: 1.5, sm: 2, md: 3 },
      }}
    >
      {children}
    </Box>
  );
}

/**
 * 響應式字體大小
 */
export function ResponsiveText({ 
  children,
  variant = 'body1'
}: { 
  children: ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2';
}) {
  const fontSizes = {
    h1: { xs: '2rem', sm: '2.5rem', md: '3rem' },
    h2: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
    h3: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
    h4: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
    h5: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
    h6: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
    body1: { xs: '0.875rem', sm: '0.9375rem', md: '1rem' },
    body2: { xs: '0.8125rem', sm: '0.875rem', md: '0.9375rem' },
  };

  return (
    <Box
      component={(variant.startsWith('h') ? variant : 'span') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span'}
      sx={{
        fontSize: fontSizes[variant],
        fontWeight: variant.startsWith('h') ? 600 : 400,
        lineHeight: variant.startsWith('h') ? 1.2 : 1.5,
      }}
    >
      {children}
    </Box>
  );
}
