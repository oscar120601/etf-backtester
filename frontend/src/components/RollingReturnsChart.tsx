import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface RollingReturnsChartProps {
  periods: Record<string, {
    window_years: number;
    dates: string[];
    returns: number[];
    stats: {
      mean: number;
      median: number;
      std: number;
      min: number;
      max: number;
      percentile_5: number;
      percentile_25: number;
      percentile_75: number;
      percentile_95: number;
    };
  }>;
}

const RollingReturnsChart: React.FC<RollingReturnsChartProps> = ({ periods }) => {
  const windows = Object.keys(periods).sort((a, b) => Number(a) - Number(b));

  // 分布圖數據
  const distributionData = {
    labels: windows.map(w => `${w}年`),
    datasets: [
      {
        label: '5th 百分位',
        data: windows.map(w => periods[w].stats.percentile_5),
        backgroundColor: 'rgba(244, 67, 54, 0.3)',
        borderColor: 'rgba(244, 67, 54, 1)',
        borderWidth: 1,
      },
      {
        label: '25th 百分位',
        data: windows.map(w => periods[w].stats.percentile_25 - periods[w].stats.percentile_5),
        backgroundColor: 'rgba(255, 152, 0, 0.3)',
        borderColor: 'rgba(255, 152, 0, 1)',
        borderWidth: 1,
      },
      {
        label: '中位數',
        data: windows.map(w => periods[w].stats.median - periods[w].stats.percentile_25),
        backgroundColor: 'rgba(76, 175, 80, 0.5)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 1,
      },
      {
        label: '75th 百分位',
        data: windows.map(w => periods[w].stats.percentile_75 - periods[w].stats.median),
        backgroundColor: 'rgba(255, 152, 0, 0.3)',
        borderColor: 'rgba(255, 152, 0, 1)',
        borderWidth: 1,
      },
      {
        label: '95th 百分位',
        data: windows.map(w => periods[w].stats.percentile_95 - periods[w].stats.percentile_75),
        backgroundColor: 'rgba(244, 67, 54, 0.3)',
        borderColor: 'rgba(244, 67, 54, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: '報酬率 (%)',
        },
        ticks: {
          callback: (value: number) => `${value}%`,
        },
        grid: {
          color: (ctx: any) => ctx.tick.value === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
          lineWidth: (ctx: any) => ctx.tick.value === 0 ? 2 : 1,
        },
      },
      x: {
        title: {
          display: true,
          text: '持有期間',
        },
      },
    },
  };

  const boxOptions: any = {
    ...options,
    plugins: {
      ...options.plugins,
      title: {
        display: true,
        text: '滾動報酬分布箱型圖',
      },
    },
  };

  return (
    <div>
      <div style={{ height: '350px', marginBottom: '30px' }}>
        <Chart type="bar" data={distributionData} options={boxOptions} />
      </div>
      
      {/* 百分位數說明 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px',
        flexWrap: 'wrap',
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: 20, height: 20, backgroundColor: 'rgba(244, 67, 54, 0.3)', border: '1px solid #f44336' }} />
          <span style={{ fontSize: '12px' }}>最差 5%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: 20, height: 20, backgroundColor: 'rgba(255, 152, 0, 0.3)', border: '1px solid #ff9800' }} />
          <span style={{ fontSize: '12px' }}>較差 20%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: 20, height: 20, backgroundColor: 'rgba(76, 175, 80, 0.5)', border: '1px solid #4caf50' }} />
          <span style={{ fontSize: '12px' }}>中間 50%（典型表現）</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: 20, height: 20, backgroundColor: 'rgba(255, 152, 0, 0.3)', border: '1px solid #ff9800' }} />
          <span style={{ fontSize: '12px' }}>較好 20%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: 20, height: 20, backgroundColor: 'rgba(244, 67, 54, 0.3)', border: '1px solid #f44336' }} />
          <span style={{ fontSize: '12px' }}>最佳 5%</span>
        </div>
      </div>
    </div>
  );
};

export default RollingReturnsChart;
