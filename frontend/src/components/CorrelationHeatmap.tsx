import React from 'react';

interface CorrelationHeatmapProps {
  heatmap: {
    symbols: string[];
    data: Array<{
      x: string;
      y: string;
      value: number;
      color: string;
      level: {
        description: string;
      };
    }>;
    matrix: Record<string, Record<string, number>>;
  };
  symbols: string[];
}

const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ heatmap, symbols }) => {
  const cellSize = 60;
  const headerSize = 50;

  // 取得相關性值
  const getCorrelation = (symbol1: string, symbol2: string) => {
    const item = heatmap.data.find(d => d.x === symbol1 && d.y === symbol2);
    return item?.value ?? 0;
  };

  // 取得顏色
  const getColor = (symbol1: string, symbol2: string) => {
    const item = heatmap.data.find(d => d.x === symbol1 && d.y === symbol2);
    return item?.color ?? '#ffffff';
  };

  // 取得文字顏色（根據背景亮度）
  const getTextColor = (bgColor: string) => {
    // 簡單判斷：如果背景是深色，文字用白色
    const darkColors = ['#d32f2f', '#f44336', '#0d47a1', '#1976d2'];
    return darkColors.includes(bgColor) ? '#ffffff' : '#000000';
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'inline-block',
          position: 'relative',
        }}
      >
        {/* Y軸標籤 + 熱力圖 */}
        <div style={{ display: 'flex' }}>
          {/* Y軸標籤 */}
          <div style={{ marginRight: '10px' }}>
            <div style={{ height: headerSize }} /> {/* 角落空白 */}
            {symbols.map((symbol, idx) => (
              <div
                key={symbol}
                style={{
                  height: cellSize,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {symbol}
              </div>
            ))}
          </div>

          {/* 熱力圖主體 */}
          <div>
            {/* X軸標籤 */}
            <div style={{ display: 'flex', marginBottom: '10px' }}>
              {symbols.map((symbol, idx) => (
                <div
                  key={symbol}
                  style={{
                    width: cellSize,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 500,
                    transform: 'rotate(-45deg)',
                    transformOrigin: 'bottom center',
                    marginBottom: '10px',
                  }}
                >
                  {symbol}
                </div>
              ))}
            </div>

            {/* 熱力圖格子 */}
            {symbols.map((symbol1, i) => (
              <div key={symbol1} style={{ display: 'flex' }}>
                {symbols.map((symbol2, j) => {
                  const color = getColor(symbol1, symbol2);
                  const value = getCorrelation(symbol1, symbol2);
                  const isDiagonal = i === j;

                  return (
                    <div
                      key={`${symbol1}-${symbol2}`}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: isDiagonal ? '#e0e0e0' : color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #ddd',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.zIndex = '10';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.zIndex = '1';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                      title={`${symbol1} vs ${symbol2}: ${(value * 100).toFixed(1)}%`}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: isDiagonal ? '#666' : getTextColor(color),
                        }}
                      >
                        {value.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 圖例 */}
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
            相關性強度
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {[
              { range: '0.8 ~ 1.0', desc: '極強正相關', color: '#d32f2f' },
              { range: '0.5 ~ 0.8', desc: '強正相關', color: '#f44336' },
              { range: '0.2 ~ 0.5', desc: '弱正相關', color: '#ff7043' },
              { range: '-0.2 ~ 0.2', desc: '無相關', color: '#ffffff', border: '#ddd' },
              { range: '-0.5 ~ -0.2', desc: '弱負相關', color: '#64b5f6' },
              { range: '-0.8 ~ -0.5', desc: '強負相關', color: '#1976d2' },
              { range: '-1.0 ~ -0.8', desc: '極強負相關', color: '#0d47a1' },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    backgroundColor: item.color,
                    border: item.border ? `1px solid ${item.border}` : 'none',
                  }}
                />
                <span style={{ fontSize: '12px' }}>
                  {item.range}: {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationHeatmap;
