# ETF 回測工具 - 系統架構文件

## 📋 文件資訊

| 項目 | 內容 |
|------|------|
| 文件版本 | v1.0 |
| 建立日期 | 2026-03-11 |
| 作者 | System Architect |
| 狀態 | Draft |

---

## 1. 系統概述

### 1.1 架構目標
- **可擴展性**：支援 ETF 清單動態擴充至 100+ 檔
- **高效能**：回測計算 < 3 秒
- **可靠性**：99.9% 可用性
- **維護性**：模組化設計，易於維護

### 1.2 技術棧選型

| 層級 | 技術選型 | 備選方案 |
|------|---------|---------|
| **前端** | React 18 + TypeScript + Tailwind CSS | Vue 3, Next.js |
| **圖表** | Chart.js + D3.js | Recharts, Plotly |
| **後端** | Python FastAPI | Node.js Express, Go |
| **計算** | Pandas + NumPy | Polars (高效能替代) |
| **資料庫** | PostgreSQL 16 | MySQL 8, MongoDB |
| **快取** | Redis 7 | Memcached |
| **訊息佇列** | Celery + Redis | RabbitMQ |
| **容器化** | Docker + Docker Compose | Podman |
| **部署** | AWS / GCP / Azure | Render, Railway |

---

## 2. 系統架構圖

### 2.1 高層架構

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用戶層 (Client)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Desktop    │  │    Tablet    │  │    Mobile    │              │
│  │   Browser    │  │   Browser    │  │   Browser    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTPS
┌─────────────────────────────────────────────────────────────────────┐
│                          網路層 (Network)                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  CloudFront / CloudFlare CDN  (靜態資源快取)                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         應用層 (Application)                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Nginx (Reverse Proxy)                     │   │
│  │                  SSL Termination / Load Balance              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   前端應用 (SPA)      │ │   API 服務層      │ │   背景任務        │
│  ┌────────────────┐  │ │  ┌────────────┐  │ │  ┌────────────┐  │
│  │  React App     │  │ │  │  FastAPI   │  │ │  │  Celery    │  │
│  │  - 回測設定     │  │ │  │  - 回測API │  │ │  │  Workers   │  │
│  │  - 圖表渲染     │  │ │  │  - ETF API │  │ │  │  - 資料同步 │  │
│  │  - 報告匯出     │  │ │  │  - 報告API │  │ │  │  - 資料計算 │  │
│  └────────────────┘  │ │  └────────────┘  │ │  └────────────┘  │
└──────────────────────┘ └──────────────────┘ └──────────────────┘
                               │                      │
                               └──────────┬───────────┘
                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          資料層 (Data)                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │    External APIs         │  │
│  │  - ETF 資料  │  │  - 快取      │  │  - Yahoo Finance         │  │
│  │  - 價格資料  │  │  - Session   │  │  - Alpha Vantage         │  │
│  │  - 回測結果  │  │  - Rate Limit│  │  - Exchange Rates        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 微服務拆分（進階架構）

當規模擴大時，可拆分為以下微服務：

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│              (Kong / AWS API Gateway)                       │
└─────────────────────────────────────────────────────────────┘
       │            │            │            │
       ▼            ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ ETF      │ │ Backtest │ │ Report   │ │ User     │
│ Service  │ │ Service  │ │ Service  │ │ Service  │
│          │ │          │ │          │ │          │
│ - ETF CRUD│ │ - 回測計算│ │ - 報告生成│ │ - 認證   │
│ - 資料同步│ │ - 快取   │ │ - 匯出   │ │ - 組合管理│
└──────────┘ └──────────┘ └──────────┘ └──────────┘
       │            │            │            │
       └────────────┴────────────┴────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │   Message Queue     │
              │     (Redis/Rabbit)  │
              └─────────────────────┘
```

---

## 3. 核心模組設計

### 3.1 前端模組

```
src/
├── components/              # UI 元件
│   ├── common/             # 通用元件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Modal.tsx
│   ├── portfolio/          # 投資組合相關
│   │   ├── PortfolioBuilder.tsx    # 組合建構器
│   │   ├── AssetAllocation.tsx     # 資產配置
│   │   ├── WeightSlider.tsx        # 權重滑桿
│   │   └── ETFPicker.tsx           # ETF 選擇器
│   ├── charts/             # 圖表元件
│   │   ├── PerformanceChart.tsx    # 績效圖
│   │   ├── DrawdownChart.tsx       # 回撤圖
│   │   ├── AnnualReturnChart.tsx   # 年度報酬圖
│   │   └── CorrelationHeatmap.tsx  # 相關性熱力圖
│   └── backtest/           # 回測相關
│       ├── BacktestForm.tsx        # 回測表單
│       ├── ResultSummary.tsx       # 結果摘要
│       └── MetricCard.tsx          # 指標卡片
├── hooks/                  # 自定義 Hooks
│   ├── useBacktest.ts      # 回測邏輯
│   ├── useETFData.ts       # ETF 資料
│   └── usePortfolio.ts     # 投資組合管理
├── services/               # API 服務
│   ├── api.ts              # Axios 設定
│   ├── etfService.ts       # ETF API
│   └── backtestService.ts  # 回測 API
├── types/                  # TypeScript 型別
│   ├── etf.ts
│   ├── portfolio.ts
│   └── backtest.ts
├── utils/                  # 工具函數
│   ├── calculations.ts     # 計算工具
│   └── formatters.ts       # 格式化工具
├── context/                # React Context
│   └── PortfolioContext.tsx
└── App.tsx
```

### 3.2 後端模組

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 應用入口
│   ├── config.py            # 設定檔
│   ├── dependencies.py      # 依賴注入
│   │
│   ├── api/                 # API 路由
│   │   ├── __init__.py
│   │   ├── v1/              # API v1
│   │   │   ├── __init__.py
│   │   │   ├── etf.py       # ETF 相關 API
│   │   │   ├── backtest.py  # 回測 API
│   │   │   ├── portfolio.py # 投資組合 API
│   │   │   └── report.py    # 報告 API
│   │   └── deps.py          # API 依賴
│   │
│   ├── models/              # SQLAlchemy 模型
│   │   ├── __init__.py
│   │   ├── etf.py           # ETF 模型
│   │   ├── price.py         # 價格模型
│   │   ├── portfolio.py     # 投資組合模型
│   │   └── backtest.py      # 回測結果模型
│   │
│   ├── schemas/             # Pydantic 模型
│   │   ├── __init__.py
│   │   ├── etf.py           # ETF Schema
│   │   ├── backtest.py      # 回測 Schema
│   │   └── portfolio.py     # 投資組合 Schema
│   │
│   ├── services/            # 業務邏輯
│   │   ├── __init__.py
│   │   ├── etf_service.py   # ETF 服務
│   │   ├── backtest_service.py      # 回測服務
│   │   ├── calculation_service.py   # 計算服務
│   │   └── data_sync_service.py     # 資料同步服務
│   │
│   ├── core/                # 核心功能
│   │   ├── __init__.py
│   │   ├── calculations.py  # 財務計算
│   │   ├── metrics.py       # 績效指標
│   │   └── backtest_engine.py       # 回測引擎
│   │
│   ├── db/                  # 資料庫
│   │   ├── __init__.py
│   │   ├── session.py       # 資料庫連線
│   │   └── base.py          # Base 模型
│   │
│   └── tasks/               # Celery 背景任務
│       ├── __init__.py
│       └── data_sync.py     # 資料同步任務
│
├── alembic/                 # 資料庫遷移
├── tests/                   # 測試
├── docker/                  # Docker 設定
├── requirements.txt
└── Dockerfile
```

---

## 4. 資料流設計

### 4.1 回測流程

```
用戶操作                          前端                           後端                          資料庫
   │                              │                              │                              │
   │  1. 設定投資組合              │                              │                              │
   │  >                          │                              │                              │
   │                              │                              │                              │
   │  2. 點擊「開始回測」           │                              │                              │
   │  >                          │                              │                              │
   │                              │  3. POST /api/backtest       │                              │
   │                              │  {portfolio, params}         │                              │
   │                              │  >                          │                              │
   │                              │                              │                              │
   │                              │                              │  4. 檢查快取                  │
   │                              │                              │  (Redis)                     │
   │                              │                              │  <                          │
   │                              │                              │                              │
   │                              │                              │  5. 若無快取，查詢價格資料     │
   │                              │                              │  SELECT * FROM etf_prices    │
   │                              │                              │  >                          │
   │                              │                              │  <                          │
   │                              │                              │                              │
   │                              │                              │  6. 執行回測計算              │
   │                              │                              │  BacktestEngine.run()        │
   │                              │                              │                              │
   │                              │                              │  7. 計算績效指標              │
   │                              │                              │  calculate_metrics()         │
   │                              │                              │                              │
   │                              │                              │  8. 存入快取                  │
   │                              │                              │  (Redis, TTL=1h)             │
   │                              │                              │  >                          │
   │                              │                              │                              │
   │                              │  9. 返回結果                  │                              │
   │                              │  {results, metrics, charts}  │                              │
   │                              │  <                          │                              │
   │                              │                              │                              │
   │  10. 渲染圖表與報告           │                              │                              │
   │  <                          │                              │                              │
```

### 4.2 資料同步流程（背景任務）

```
排程器 (Cron)                    Celery Worker                  外部 API                     資料庫
    │                               │                              │                            │
    │  1. 每日 00:00 觸發          │                              │                            │
    │  >                          │                              │                            │
    │                              │                              │                            │
    │                              │  2. 取得所有活躍 ETF 清單      │                            │
    │                              │  SELECT symbol FROM etf_master│                            │
    │                              │  >                          │                            │
    │                              │  <                          │                            │
    │                              │                              │                            │
    │                              │  3. 呼叫 Yahoo Finance API   │                            │
    │                              │  fetch_daily_prices()        │                            │
    │                              │  >                          │                            │
    │                              │  <                          │                            │
    │                              │                              │                            │
    │                              │  4. 資料清洗與驗證            │                            │
    │                              │  validate_price_data()       │                            │
    │                              │                              │                            │
    │                              │  5. 批次寫入資料庫            │                            │
    │                              │  INSERT INTO etf_prices      │                            │
    │                              │  >                          │
    │                              │  <                          │
    │                              │                              │                            │
    │                              │  6. 更新快取                  │                            │
    │                              │  (Redis)                     │                            │
    │                              │                              │                            │
    │  7. 回報同步結果              │                              │                            │
    │  <                          │                              │                            │
```

---

## 5. 核心演算法設計

### 5.1 回測引擎演算法

```python
class BacktestEngine:
    """
    回測引擎核心類別
    """
    
    def run(self, portfolio: Portfolio, params: BacktestParams) -> BacktestResult:
        """
        執行回測
        
        Args:
            portfolio: 投資組合設定（ETF 清單與權重）
            params: 回測參數（日期範圍、再平衡策略等）
        
        Returns:
            BacktestResult: 回測結果
        """
        # 1. 取得歷史價格資料
        prices = self._fetch_historical_prices(portfolio.symbols, 
                                                params.start_date, 
                                                params.end_date)
        
        # 2. 初始化投資組合
        portfolio_value = params.initial_amount
        holdings = self._initialize_holdings(portfolio, portfolio_value)
        
        # 3. 逐日/逐月回測
        results = []
        for date in self._get_rebalance_dates(prices.index, params.rebalance_frequency):
            # 計算當日組合價值
            portfolio_value = self._calculate_portfolio_value(holdings, prices.loc[date])
            
            # 檢查是否需要再平衡
            if self._should_rebalance(date, params.rebalance_frequency):
                holdings = self._rebalance(portfolio, portfolio_value, prices.loc[date])
            
            # 記錄結果
            results.append({
                'date': date,
                'value': portfolio_value,
                'holdings': holdings.copy()
            })
        
        # 4. 計算績效指標
        metrics = self._calculate_metrics(results, prices)
        
        # 5. 生成圖表資料
        charts = self._generate_chart_data(results)
        
        return BacktestResult(results=results, metrics=metrics, charts=charts)
    
    def _calculate_metrics(self, results: List[Dict], prices: pd.DataFrame) -> Metrics:
        """計算績效指標"""
        values = pd.Series([r['value'] for r in results], 
                          index=[r['date'] for r in results])
        returns = values.pct_change().dropna()
        
        return Metrics(
            total_return=(values.iloc[-1] / values.iloc[0]) - 1,
            cagr=self._calculate_cagr(values),
            volatility=returns.std() * np.sqrt(252),
            max_drawdown=self._calculate_max_drawdown(values),
            sharpe_ratio=self._calculate_sharpe_ratio(returns),
            sortino_ratio=self._calculate_sortino_ratio(returns),
            calmar_ratio=self._calculate_calmar_ratio(values, returns)
        )
```

### 5.2 關鍵計算公式

| 指標 | 公式 | 說明 |
|------|------|------|
| **CAGR** | (期末價值/期初價值)^(1/年數) - 1 | 年化複合成長率 |
| **波動率** | std(日報酬) x sqrt(252) | 年化標準差 |
| **夏普比率** | (投組報酬 - 無風險利率) / 波動率 | 風險調整後報酬 |
| **最大回撤** | max(1 - 當前價值/歷史最高價值) | 最大跌幅 |
| **索丁諾比率** | (投組報酬 - 無風險利率) / 下行標準差 | 考慮下行風險 |
| **卡瑪比率** | CAGR / |最大回撤| | 報酬與回撤比 |

---

## 6. 快取策略

### 6.1 快取架構

```
┌─────────────────────────────────────────────────────────────┐
│                       多層快取架構                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  L1: 瀏覽器快取 (LocalStorage/SessionStorage)               │
│  └── ETF 基本資料（更新頻率低）                              │
│  └── 用戶投資組合設定                                        │
│                                                             │
│  L2: CDN 快取 (CloudFront/CloudFlare)                       │
│  └── 靜態資源（JS/CSS/圖片）                                │
│  └── ETF 清單 API（短暫快取）                                │
│                                                             │
│  L3: 應用快取 (Redis)                                        │
│  └── 回測結果（TTL: 1小時）                                  │
│  └── 價格資料查詢（TTL: 1天）                                │
│  └── 熱門 ETF 統計（TTL: 5分鐘）                             │
│                                                             │
│  L4: 資料庫查詢快取 (SQLAlchemy)                             │
│  └── 經常查詢的價格資料                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 快取鍵命名規則

```python
# 回測結果快取
cache_key = f"backtest:{portfolio_hash}:{start_date}:{end_date}:{rebalance_freq}"

# ETF 價格資料快取
cache_key = f"prices:{symbol}:{start_date}:{end_date}"

# ETF 基本資料快取
cache_key = f"etf:metadata:{symbol}"

# 熱門組合快取
cache_key = f"popular:portfolios:{time_range}"
```

---

## 7. 安全性設計

### 7.1 安全措施

| 層級 | 措施 | 實作方式 |
|------|------|---------|
| **傳輸層** | HTTPS/TLS 1.3 | Nginx SSL 設定 |
| **認證** | JWT Token | FastAPI JWT Middleware |
| **授權** | RBAC | Role-based access control |
| **輸入驗證** | Pydantic Schema | Request validation |
| **SQL 注入防護** | SQLAlchemy ORM | Parameterized queries |
| **XSS 防護** | 輸入清理 | Bleach / HTML escaping |
| **速率限制** | Rate Limiting | Redis-based limiter |
| **CORS** | 跨來源控制 | FastAPI CORS middleware |

### 7.2 API 速率限制

```python
# 限制設定
RATE_LIMITS = {
    "default": "100/minute",
    "backtest": "10/minute",      # 回測計算較耗資源
    "export": "5/minute",          # 匯出報告
    "data_sync": "1/minute"        # 資料同步
}
```

---

## 8. 監控與日誌

### 8.1 監控項目

| 層級 | 監控項目 | 工具 |
|------|---------|------|
| **基礎設施** | CPU/記憶體/磁碟 | AWS CloudWatch / Datadog |
| **應用程式** | API 延遲/錯誤率 | Prometheus + Grafana |
| **業務邏輯** | 回測計算時間 | Custom Metrics |
| **資料庫** | 查詢效能/連線數 | PostgreSQL Metrics |
| **快取** | 快取命中率 | Redis INFO |

### 8.2 日誌架構

```python
# 日誌格式
{
    "timestamp": "2026-03-11T10:30:00Z",
    "level": "INFO",
    "service": "backtest-api",
    "request_id": "uuid-1234",
    "user_id": "user-5678",
    "action": "run_backtest",
    "duration_ms": 1200,
    "portfolio_size": 5,
    "status": "success"
}
```

---

## 9. 部署架構

### 9.1 Docker Compose 開發環境

```yaml
version: '3.8'

services:
  # 前端
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
    environment:
      - REACT_APP_API_URL=http://localhost:8000

  # 後端 API
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/etf_backtest
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  # 背景任務 Worker
  worker:
    build: ./backend
    command: celery -A app.tasks worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/etf_backtest
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  # 排程器
  scheduler:
    build: ./backend
    command: celery -A app.tasks beat --loglevel=info
    depends_on:
      - redis

  # 資料庫
  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=etf_backtest
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 9.2 生產環境部署

```
┌─────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Ingress Controller (Nginx)                         │   │
│  │  SSL Termination, Rate Limiting                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────┼────────────────────────┐       │
│  │                        ▼                        │       │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐  │       │
│  │  │ Frontend   │  │ Backend    │  │ Worker   │  │       │
│  │  │ Pods x3    │  │ Pods x3    │  │ Pods x2  │  │       │
│  │  │ HPA Enabled│  │ HPA Enabled│  │          │  │       │
│  │  └────────────┘  └────────────┘  └──────────┘  │       │
│  │                                                │       │
│  │  ┌────────────┐  ┌────────────┐                │       │
│  │  │ PostgreSQL │  │ Redis      │                │       │
│  │  │ StatefulSet│  │ Cluster    │                │       │
│  │  └────────────┘  └────────────┘                │       │
│  │                                                │       │
│  └────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. 效能優化策略

### 10.1 回測計算優化

| 優化策略 | 實作方式 | 預期效益 |
|---------|---------|---------|
| **向量化計算** | NumPy/Pandas 向量化操作 | 10-100x 加速 |
| **資料預處理** | 日線轉週線/月線 | 減少 70% 資料量 |
| **平行計算** | multiprocessing 多核 | 線性加速 |
| **快取熱門查詢** | Redis 快取 | 減少 90% 重複計算 |
| **資料庫索引** | 複合索引 (symbol, date) | 查詢加速 10x |

### 10.2 資料庫優化

```sql
-- 價格資料表優化
CREATE TABLE etf_prices (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    adjusted_close DECIMAL(12,4) NOT NULL,
    volume BIGINT,
    -- 複合索引加速查詢
    CONSTRAINT idx_symbol_date UNIQUE (symbol, date)
) PARTITION BY RANGE (date);

-- 按年份分區
CREATE TABLE etf_prices_2024 PARTITION OF etf_prices
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- 索引
CREATE INDEX idx_prices_symbol ON etf_prices(symbol);
CREATE INDEX idx_prices_date ON etf_prices(date);
```

---

## 11. 附錄

### 11.1 環境變數設定

```bash
# 資料庫
DATABASE_URL=postgresql://user:password@localhost:5432/etf_backtest
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379/0
REDIS_CACHE_TTL=3600

# API
API_V1_STR=/api/v1
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 外部 API
YAHOO_FINANCE_API_KEY=xxx
ALPHA_VANTAGE_API_KEY=xxx

# 背景任務
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://redis:localhost:6379/2

# 監控
SENTRY_DSN=xxx
DATADOG_API_KEY=xxx
```

### 11.2 技術決策記錄 (ADR)

| 決策 | 選擇 | 理由 |
|------|------|------|
| 前端框架 | React | 生態系豐富，TypeScript 支援好 |
| 後端框架 | FastAPI | 高效能、自動文檔、型別安全 |
| 資料庫 | PostgreSQL | 支援時序資料、JSON、穩定 |
| 快取 | Redis | 支援多種資料結構、持久化 |
| 圖表 | Chart.js | 易用、互動性佳、檔案小 |
| 部署 | Docker + K8s | 可攜性、擴展性、業界標準 |

---

**文件結束**

*本文件為系統架構設計，實際實作時可能需要根據技術可行性調整。*
