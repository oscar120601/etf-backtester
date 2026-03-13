import React from 'react';
import {
  Chart as ChartJS,
  ScatterController,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import type {
  EfficientFrontierPoint,
  IndividualAsset,
  OptimizedPortfolio,
} from '../types';

// 註冊 Chart.js 組件
ChartJS.register(
  ScatterController,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

interface EfficientFrontierChartProps {
  frontier: EfficientFrontierPoint[];
  individualAssets: IndividualAsset[];
  maxSharpePoint: OptimizedPortfolio;
  minVolPoint: OptimizedPortfolio;
}

const EfficientFrontierChart: React.FC<EfficientFrontierChartProps> = ({
  frontier,
  individualAssets,
  maxSharpePoint,
  minVolPoint,
}) => {
  // 準備效率前緣曲線數據（按波動率排序）
  const sortedFrontier = [...frontier].sort((a, b) => a.volatility - b.volatility);

  // Chart.js 數據配置
  const data = {
    datasets: [
      // 效率前緣曲線
      {
        label: '效率前緣',
        data: sortedFrontier.map(p => ({
          x: p.volatility * 100, // 轉換為百分比
          y: p.expected_return * 100,
        })),
        backgroundColor: 'rgba(25, 118, 210, 0.8)',
        borderColor: 'rgba(25, 118, 210, 1)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        showLine: true, // 顯示連線
        tension: 0.4, // 平滑曲線
      },
      // 最大夏普比率點
      {
        label: '最大夏普比率',
        data: [{
          x: maxSharpePoint.volatility * 100,
          y: maxSharpePoint.expected_return * 100,
        }],
        backgroundColor: 'rgba(76, 175, 80, 1)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
        pointRadius: 10,
        pointHoverRadius: 12,
        pointStyle: 'star',
      },
      // 最小波動率點
      {
        label: '最小波動率',
        data: [{
          x: minVolPoint.volatility * 100,
          y: minVolPoint.expected_return * 100,
        }],
        backgroundColor: 'rgba(255, 152, 0, 1)',
        borderColor: 'rgba(255, 152, 0, 1)',
        borderWidth: 2,
        pointRadius: 10,
        pointHoverRadius: 12,
        pointStyle: 'triangle',
      },
      // 單一資產點
      {
        label: '單一資產',
        data: individualAssets.map(asset => ({
          x: asset.volatility * 100,
          y: asset.expected_return * 100,
          symbol: asset.symbol, // 用於 tooltip
        })),
        backgroundColor: 'rgba(158, 158, 158, 0.6)',
        borderColor: 'rgba(158, 158, 158, 1)',
        borderWidth: 1,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  // Chart.js 選項配置
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (context: any) => {
            const point = context[0];
            if (point.datasetIndex === 3) {
              // 單一資產
              return `ETF: ${point.raw.symbol}`;
            }
            return point.dataset.label;
          },
          label: (context: any) => {
            const point = context.raw;
            const lines = [
              `波動率: ${point.x.toFixed(2)}%`,
              `預期報酬: ${point.y.toFixed(2)}%`,
            ];
            
            // 如果有夏普比率，也顯示
            if (context.datasetIndex === 0) {
              // 效率前緣點
              const frontierPoint = sortedFrontier[context.dataIndex];
              if (frontierPoint) {
                lines.push(`夏普比率: ${frontierPoint.sharpe_ratio.toFixed(2)}`);
              }
            } else if (context.datasetIndex === 1) {
              lines.push(`夏普比率: ${maxSharpePoint.sharpe_ratio.toFixed(2)}`);
            } else if (context.datasetIndex === 2) {
              lines.push(`夏普比率: ${minVolPoint.sharpe_ratio.toFixed(2)}`);
            } else if (context.datasetIndex === 3) {
              // 單一資產
              const asset = individualAssets.find(a => a.symbol === point.symbol);
              if (asset) {
                lines.push(`夏普比率: ${asset.sharpe_ratio.toFixed(2)}`);
              }
            }
            
            return lines;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '波動率 (%)',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value: number) => `${value.toFixed(1)}%`,
        },
      },
      y: {
        title: {
          display: true,
          text: '預期年化報酬率 (%)',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: (value: number) => `${value.toFixed(1)}%`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'point',
    },
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Scatter data={data} options={options} />
    </div>
  );
};

export default EfficientFrontierChart;
