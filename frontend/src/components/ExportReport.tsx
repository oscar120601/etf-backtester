import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { BacktestResponse } from '../types';

interface ExportReportProps {
  result: BacktestResponse;
  chartRef?: React.RefObject<HTMLDivElement>;
}

export default function ExportReport({ result, chartRef }: ExportReportProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleOpen = () => {
    setOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // 匯出 CSV
  const exportCSV = () => {
    try {
      setLoading(true);
      setError(null);

      // 構建 CSV 內容
      const lines: string[] = [];

      // 標題
      lines.push('ETF Backtest Report');
      lines.push(`Generated at: ${new Date().toLocaleString()}`);
      lines.push('');

      // 投資組合配置
      lines.push('Portfolio Configuration');
      lines.push('Symbol,Weight');
      result.portfolio.forEach((holding) => {
        lines.push(`${holding.symbol},${(holding.weight * 100).toFixed(2)}%`);
      });
      lines.push('');

      // 回測參數
      lines.push('Backtest Parameters');
      lines.push(`Start Date,${result.parameters.start_date}`);
      lines.push(`End Date,${result.parameters.end_date}`);
      lines.push(`Initial Amount,$${result.parameters.initial_amount.toLocaleString()}`);
      lines.push(`Rebalance Frequency,${result.parameters.rebalance_frequency}`);
      if (result.parameters.monthly_contribution) {
        lines.push(`Monthly Contribution,$${result.parameters.monthly_contribution.toLocaleString()}`);
      }
      lines.push('');

      // 績效摘要
      lines.push('Performance Summary');
      lines.push('Metric,Value');
      lines.push(`Total Return,${(result.metrics.total_return * 100).toFixed(2)}%`);
      lines.push(`CAGR,${(result.metrics.cagr * 100).toFixed(2)}%`);
      lines.push(`Volatility,${(result.metrics.volatility * 100).toFixed(2)}%`);
      lines.push(`Max Drawdown,${(result.metrics.max_drawdown * 100).toFixed(2)}%`);
      lines.push(`Sharpe Ratio,${result.metrics.sharpe_ratio.toFixed(2)}`);
      lines.push(`Sortino Ratio,${result.metrics.sortino_ratio.toFixed(2)}`);
      lines.push(`Calmar Ratio,${result.metrics.calmar_ratio.toFixed(2)}`);
      lines.push(`Best Year,${(result.metrics.best_year * 100).toFixed(2)}%`);
      lines.push(`Worst Year,${(result.metrics.worst_year * 100).toFixed(2)}%`);
      lines.push(`Positive Years,${result.metrics.positive_years}`);
      lines.push(`Negative Years,${result.metrics.negative_years}`);
      lines.push(`VaR 95%,${(result.metrics.var_95 * 100).toFixed(2)}%`);
      lines.push(`CVaR 95%,${(result.metrics.cvar_95 * 100).toFixed(2)}%`);
      lines.push('');

      // 時間序列數據
      lines.push('Time Series Data');
      lines.push('Date,Portfolio Value,Drawdown');
      result.time_series.portfolio_value.forEach((point, index) => {
        const drawdown = result.time_series.drawdown[index]?.value || 0;
        lines.push(`${point.date},${point.value.toFixed(2)},${(drawdown * 100).toFixed(2)}%`);
      });

      // 下載檔案
      const csvContent = lines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `backtest_report_${result.backtest_id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess('CSV 報告已成功匯出！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('匯出 CSV 失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 匯出 PDF
  const exportPDF = async () => {
    try {
      setLoading(true);
      setError(null);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      // 標題
      pdf.setFontSize(20);
      pdf.setTextColor(25, 118, 210);
      pdf.text('ETF Backtest Report', margin, yPos);
      yPos += 10;

      // 生成時間
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated at: ${new Date().toLocaleString()}`, margin, yPos);
      yPos += 15;

      // 投資組合配置
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Portfolio Configuration', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      result.portfolio.forEach((holding) => {
        pdf.text(`${holding.symbol}: ${(holding.weight * 100).toFixed(2)}%`, margin + 5, yPos);
        yPos += 5;
      });
      yPos += 5;

      // 回測參數
      pdf.setFontSize(14);
      pdf.text('Backtest Parameters', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.text(`Period: ${result.parameters.start_date} to ${result.parameters.end_date}`, margin + 5, yPos);
      yPos += 5;
      pdf.text(`Initial Amount: $${result.summary.initial_value.toLocaleString()}`, margin + 5, yPos);
      yPos += 5;
      pdf.text(`Final Value: $${Math.round(result.summary.final_value).toLocaleString()}`, margin + 5, yPos);
      yPos += 5;
      pdf.text(`Rebalance: ${result.parameters.rebalance_frequency}`, margin + 5, yPos);
      yPos += 10;

      // 績效摘要
      pdf.setFontSize(14);
      pdf.text('Performance Summary', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      const metrics = [
        { label: 'Total Return', value: `${(result.metrics.total_return * 100).toFixed(2)}%` },
        { label: 'CAGR', value: `${(result.metrics.cagr * 100).toFixed(2)}%` },
        { label: 'Volatility', value: `${(result.metrics.volatility * 100).toFixed(2)}%` },
        { label: 'Max Drawdown', value: `${(result.metrics.max_drawdown * 100).toFixed(2)}%` },
        { label: 'Sharpe Ratio', value: result.metrics.sharpe_ratio.toFixed(2) },
        { label: 'Sortino Ratio', value: result.metrics.sortino_ratio.toFixed(2) },
        { label: 'Calmar Ratio', value: result.metrics.calmar_ratio.toFixed(2) },
        { label: 'Best Year', value: `${(result.metrics.best_year * 100).toFixed(2)}%` },
        { label: 'Worst Year', value: `${(result.metrics.worst_year * 100).toFixed(2)}%` },
      ];

      // 兩欄顯示
      const col1X = margin + 5;
      const col2X = margin + pageWidth / 2;
      metrics.forEach((metric, index) => {
        const x = index % 2 === 0 ? col1X : col2X;
        const y = yPos + Math.floor(index / 2) * 6;
        pdf.text(`${metric.label}: ${metric.value}`, x, y);
      });
      yPos += Math.ceil(metrics.length / 2) * 6 + 10;

      // 如果有圖表，嘗試截圖加入
      if (chartRef?.current) {
        try {
          pdf.addPage();
          yPos = margin;
          
          pdf.setFontSize(14);
          pdf.text('Portfolio Chart', margin, yPos);
          yPos += 10;

          const canvas = await html2canvas(chartRef.current, {
            scale: 2,
            useCORS: true,
            logging: false,
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - margin * 2;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        } catch (chartErr) {
          console.error('Failed to capture chart:', chartErr);
        }
      }

      // 下載 PDF
      pdf.save(`backtest_report_${result.backtest_id}.pdf`);

      setSuccess('PDF 報告已成功匯出！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('PDF export error:', err);
      setError('匯出 PDF 失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={handleOpen}
        disabled={!result}
      >
        匯出報告
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>匯出回測報告</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            選擇匯出格式：
          </Typography>

          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={exportCSV} disabled={loading}>
                <ListItemIcon>
                  <CsvIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="匯出 CSV"
                  secondary="包含時間序列數據和績效指標的試算表格式"
                />
                {loading && <CircularProgress size={20} />}
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={exportPDF} disabled={loading}>
                <ListItemIcon>
                  <PdfIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="匯出 PDF"
                  secondary="包含圖表和績效摘要的 PDF 文件"
                />
                {loading && <CircularProgress size={20} />}
              </ListItemButton>
            </ListItem>
          </List>

          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              報告內容：
            </Typography>
            <Typography variant="caption" component="div" color="text.secondary">
              • 投資組合配置與權重
            </Typography>
            <Typography variant="caption" component="div" color="text.secondary">
              • 回測參數設定
            </Typography>
            <Typography variant="caption" component="div" color="text.secondary">
              • 績效指標（CAGR、夏普比率、最大回撤等）
            </Typography>
            <Typography variant="caption" component="div" color="text.secondary">
              • 時間序列數據（CSV）
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>關閉</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
