import React from 'react';
import { Alert, AlertTitle, Collapse, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ErrorAlertProps {
  error: string | null;
  onClose?: () => void;
  title?: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  error, 
  onClose, 
  title = '錯誤',
  severity = 'error'
}) => {
  if (!error) return null;

  return (
    <Collapse in={!!error}>
      <Alert
        severity={severity}
        action={
          onClose && (
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={onClose}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          )
        }
        sx={{ mb: 2 }}
      >
        <AlertTitle>{title}</AlertTitle>
        {error}
      </Alert>
    </Collapse>
  );
};

export default ErrorAlert;
