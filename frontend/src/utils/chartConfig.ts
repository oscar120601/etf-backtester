/**
 * Chart.js 全局配置
 * 啟用 zoom 和 pan 功能
 */

import { Chart as ChartJS } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

// 註冊 zoom 插件
ChartJS.register(zoomPlugin);

// 通用圖表選項（包含 zoom/pan）
export const getChartOptionsWithZoom = (options: any = {}) => {
  return {
    ...options,
    plugins: {
      ...options.plugins,
      zoom: {
        pan: {
          enabled: true,
          mode: 'x' as const,
          modifierKey: 'ctrl', // 按住 Ctrl 鍵啟用 pan
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x' as const,
          drag: {
            enabled: true,
            backgroundColor: 'rgba(25, 118, 210, 0.2)',
            borderColor: 'rgba(25, 118, 210, 0.5)',
            borderWidth: 1,
          },
        },
        limits: {
          x: { min: 'original' as const, max: 'original' as const },
        },
      },
    },
  };
};

// 圖表下載功能
export const downloadChart = (chartRef: any, filename: string = 'chart.png') => {
  if (!chartRef?.current) return;

  const canvas = chartRef.current.canvas;
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 重置縮放
export const resetChartZoom = (chartRef: any) => {
  if (!chartRef?.current) return;
  chartRef.current.resetZoom();
};
