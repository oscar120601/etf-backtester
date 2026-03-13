import React from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';

interface LoadingOverlayProps {
  message?: string;
  show?: boolean;
  open?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = '載入中...', 
  show,
  open
}) => {
  const isVisible = open ?? show ?? true;
  if (!isVisible) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="h6" color="text.secondary">
          {message}
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoadingOverlay;
