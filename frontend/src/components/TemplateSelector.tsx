import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
} from '@mui/material';
import { AccountBalance as TemplateIcon, Close as CloseIcon } from '@mui/icons-material';
import { PortfolioTemplate, templatesByCategory, templateCategories } from '../data/portfolioTemplates';

interface TemplateSelectorProps {
  onSelect: (template: PortfolioTemplate) => void;
  disabled?: boolean;
}

export default function TemplateSelector({ onSelect, disabled }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(templateCategories[0]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSelect = (template: PortfolioTemplate) => {
    onSelect(template);
    handleClose();
  };

  const currentTemplates = templatesByCategory[selectedCategory] || [];

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<TemplateIcon />}
        onClick={handleOpen}
        disabled={disabled}
        size="small"
      >
        套用模板
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">選擇預設配置模板</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Tabs
            value={selectedCategory}
            onChange={(_, value) => setSelectedCategory(value)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2 }}
          >
            {templateCategories.map((category) => (
              <Tab key={category} label={category} value={category} />
            ))}
          </Tabs>

          <Grid container spacing={2}>
            {currentTemplates.map((template) => (
              <Grid item xs={12} sm={6} key={template.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handleSelect(template)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        配置:
                      </Typography>
                      {template.holdings.map((holding) => (
                        <Tooltip key={holding.symbol} title={holding.name}>
                          <Chip
                            label={`${holding.symbol} ${(holding.weight * 100).toFixed(0)}%`}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        </Tooltip>
                      ))}
                    </Box>

                    <Box>
                      {template.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>取消</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
