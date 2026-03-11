# ETF 回測工具 - API 設計文件

## 📋 文件資訊

| 項目 | 內容 |
|------|------|
| 文件版本 | v1.0 |
| 建立日期 | 2026-03-11 |
| API 版本 | v1 |
| 協議 | RESTful + JSON |

---

## 1. API 概覽

### 1.1 Base URL

```
開發環境: http://localhost:8000/api/v1
生產環境: https://api.etfbacktester.com/api/v1
```

### 1.2 認證方式

使用 Bearer Token (JWT) 認證：

```http
Authorization: Bearer <jwt_token>
```

### 1.3 通用回應格式

**成功回應 (2xx)**
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

**錯誤回應 (4xx/5xx)**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "權重總和必須等於 100%",
    "details": { ... }
  }
}
```

### 1.4 HTTP 狀態碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 成功 |
| 201 | 資源已建立 |
| 400 | 請求參數錯誤 |
| 401 | 未認證 |
| 403 | 權限不足 |
| 404 | 資源不存在 |
| 422 | 驗證錯誤 |
| 429 | 請求過於頻繁 |
| 500 | 伺服器內部錯誤 |

### 1.5 速率限制

| 端點類型 | 限制 |
|---------|------|
| 一般 API | 100 次/分鐘 |
| 回測計算 | 10 次/分鐘 |
| 報告匯出 | 5 次/分鐘 |

---

## 2. ETF 相關 API

### 2.1 取得 ETF 清單

```http
GET /etfs
```

**Query Parameters**

| 參數 | 類型 | 必填 | 說明 | 預設值 |
|------|------|------|------|--------|
| asset_class | string | 否 | 資產類別篩選 | - |
| region | string | 否 | 區域篩選 | - |
| search | string | 否 | 關鍵字搜尋 | - |
| is_active | boolean | 否 | 只顯示啟用的 ETF | true |
| page | integer | 否 | 頁碼 | 1 |
| limit | integer | 否 | 每頁數量 | 20 |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "symbol": "VTI",
        "name": "Vanguard Total Stock Market ETF",
        "name_zh": "Vanguard 全市場股票 ETF",
        "issuer": "Vanguard",
        "asset_class": "Equity",
        "asset_subclass": "US Total Market",
        "factor_type": null,
        "region": "US",
        "expense_ratio": 0.0003,
        "inception_date": "2001-05-24",
        "exchange": "NYSE",
        "currency": "USD",
        "is_active": true,
        "is_recommended": true,
        "min_data_year": 2001,
        "risk_level": 4,
        "tags": ["broad-market", "large-cap", "small-cap"],
        "description": "追蹤 CRSP US Total Market Index...",
        "last_price": 285.42,
        "last_price_date": "2026-03-10",
        "total_return_1y": 0.1856,
        "total_return_3y": 0.4231,
        "total_return_5y": 0.7892
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 40,
      "total_pages": 2
    },
    "filters": {
      "asset_classes": ["Equity", "Fixed Income", "REITs", "Commodities"],
      "regions": ["US", "Developed", "Emerging", "Global"]
    }
  }
}
```

---

### 2.2 取得單一 ETF 詳情

```http
GET /etfs/{symbol}
```

**Path Parameters**

| 參數 | 類型 | 說明 |
|------|------|------|
| symbol | string | ETF 代碼 (例: VTI) |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "symbol": "VTI",
    "name": "Vanguard Total Stock Market ETF",
    "name_zh": "Vanguard 全市場股票 ETF",
    "issuer": "Vanguard",
    "asset_class": "Equity",
    "asset_subclass": "US Total Market",
    "region": "US",
    "expense_ratio": 0.0003,
    "inception_date": "2001-05-24",
    "exchange": "NYSE",
    "currency": "USD",
    "description": "追蹤 CRSP US Total Market Index...",
    "holdings_count": 3954,
    "top_10_holdings": [
      {"symbol": "AAPL", "name": "Apple Inc", "weight": 0.0543},
      {"symbol": "MSFT", "name": "Microsoft Corp", "weight": 0.0487}
    ],
    "sector_allocation": {
      "Technology": 0.3124,
      "Healthcare": 0.1245,
      "Financials": 0.1132
    },
    "statistics": {
      "aum_billions": 358.2,
      "avg_daily_volume": 4500000,
      "beta": 1.02,
      "pe_ratio": 22.4,
      "yield": 0.0132
    }
  }
}
```

---

### 2.3 取得 ETF 歷史價格

```http
GET /etfs/{symbol}/prices
```

**Query Parameters**

| 參數 | 類型 | 必填 | 說明 | 預設值 |
|------|------|------|------|--------|
| start_date | string | 是 | 開始日期 (YYYY-MM-DD) | - |
| end_date | string | 否 | 結束日期 (YYYY-MM-DD) | 今日 |
| frequency | string | 否 | 資料頻率 (daily/weekly/monthly) | daily |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "symbol": "VTI",
    "currency": "USD",
    "frequency": "daily",
    "prices": [
      {
        "date": "2024-01-02",
        "open": 245.32,
        "high": 247.15,
        "low": 244.89,
        "close": 246.78,
        "adjusted_close": 246.78,
        "volume": 3256789,
        "dividend": 0
      },
      {
        "date": "2024-01-03",
        "open": 246.50,
        "high": 248.20,
        "low": 245.80,
        "close": 247.35,
        "adjusted_close": 247.35,
        "volume": 2894561,
        "dividend": 0
      }
    ]
  }
}
```

---

### 2.4 取得 ETF 績效統計

```http
GET /etfs/{symbol}/statistics
```

**Query Parameters**

| 參數 | 類型 | 必填 | 說明 | 預設值 |
|------|------|------|------|--------|
| period | string | 否 | 期間 (1y/3y/5y/10y/ytd/max) | max |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "symbol": "VTI",
    "period": "10y",
    "start_date": "2014-03-11",
    "end_date": "2024-03-11",
    "total_return": 1.8765,
    "cagr": 0.1123,
    "volatility": 0.1542,
    "sharpe_ratio": 0.73,
    "max_drawdown": -0.2376,
    "calmar_ratio": 0.47,
    "best_year": 0.3154,
    "worst_year": -0.2058,
    "positive_months_pct": 0.65,
    "rolling_returns": {
      "1y": { "min": -0.2058, "max": 0.3154, "median": 0.1256 },
      "3y": { "min": 0.0234, "max": 0.2891, "median": 0.1342 },
      "5y": { "min": 0.0654, "max": 0.2456, "median": 0.1289 }
    }
  }
}
```

---

### 2.5 取得 ETF 相關性矩陣

```http
POST /etfs/correlation
```

**Request Body**
```json
{
  "symbols": ["VTI", "VOO", "VXUS", "BND"],
  "start_date": "2020-01-01",
  "end_date": "2024-12-31",
  "frequency": "monthly"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "symbols": ["VTI", "VOO", "VXUS", "BND"],
    "period": "2020-01-01 to 2024-12-31",
    "correlation_matrix": {
      "VTI": { "VTI": 1.0, "VOO": 0.99, "VXUS": 0.87, "BND": -0.03 },
      "VOO": { "VTI": 0.99, "VOO": 1.0, "VXUS": 0.86, "BND": -0.02 },
      "VXUS": { "VTI": 0.87, "VOO": 0.86, "VXUS": 1.0, "BND": 0.05 },
      "BND": { "VTI": -0.03, "VOO": -0.02, "VXUS": 0.05, "BND": 1.0 }
    }
  }
}
```

---

## 3. 回測 API

### 3.1 執行回測

```http
POST /backtest
```

**Request Body**
```json
{
  "portfolio": {
    "name": "我的投資組合",
    "holdings": [
      { "symbol": "VTI", "weight": 0.40 },
      { "symbol": "VXUS", "weight": 0.20 },
      { "symbol": "BND", "weight": 0.30 },
      { "symbol": "VNQ", "weight": 0.10 }
    ]
  },
  "parameters": {
    "start_date": "2015-01-01",
    "end_date": "2024-12-31",
    "initial_amount": 10000,
    "rebalance_frequency": "annual",
    "rebalance_threshold": null,
    "cashflow": {
      "enabled": false,
      "amount": 0,
      "frequency": "monthly"
    }
  },
  "benchmark": "SPY"
}
```

**參數說明**

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| portfolio.name | string | 否 | 組合名稱 |
| portfolio.holdings | array | 是 | 持有標的陣列 |
| portfolio.holdings[].symbol | string | 是 | ETF 代碼 |
| portfolio.holdings[].weight | number | 是 | 權重 (0-1) |
| parameters.start_date | string | 是 | 回測開始日期 |
| parameters.end_date | string | 是 | 回測結束日期 |
| parameters.initial_amount | number | 否 | 初始金額 | 10000 |
| parameters.rebalance_frequency | string | 否 | 再平衡頻率 (monthly/quarterly/annual/none) | annual |
| parameters.rebalance_threshold | number | 否 | 再平衡閾值 (偏離目標權重比例) | null |
| parameters.cashflow.enabled | boolean | 否 | 是否啟用定期投入 | false |
| parameters.cashflow.amount | number | 否 | 定期投入金額 | 0 |
| parameters.cashflow.frequency | string | 否 | 投入頻率 | monthly |
| benchmark | string | 否 | 基準比較標的 | null |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "backtest_id": "bt-uuid-1234",
    "portfolio": {
      "name": "我的投資組合",
      "holdings": [
        { "symbol": "VTI", "name": "Vanguard Total Stock Market ETF", "weight": 0.40 },
        { "symbol": "VXUS", "name": "Vanguard Total International Stock ETF", "weight": 0.20 },
        { "symbol": "BND", "name": "Vanguard Total Bond Market ETF", "weight": 0.30 },
        { "symbol": "VNQ", "name": "Vanguard Real Estate ETF", "weight": 0.10 }
      ]
    },
    "parameters": {
      "start_date": "2015-01-01",
      "end_date": "2024-12-31",
      "initial_amount": 10000,
      "rebalance_frequency": "annual"
    },
    "summary": {
      "start_value": 10000,
      "end_value": 28456.78,
      "total_return": 1.8457,
      "cagr": 0.1124,
      "years": 10.0
    },
    "metrics": {
      "total_return": 1.8457,
      "cagr": 0.1124,
      "volatility": 0.1123,
      "sharpe_ratio": 1.00,
      "sortino_ratio": 1.45,
      "max_drawdown": -0.1456,
      "max_drawdown_duration_days": 127,
      "calmar_ratio": 0.77,
      "best_year": 0.2456,
      "worst_year": -0.0891,
      "positive_years": 8,
      "negative_years": 2,
      "avg_up_month": 0.0321,
      "avg_down_month": -0.0234,
      "skewness": -0.45,
      "kurtosis": 3.21,
      "var_95": -0.0456,
      "cvar_95": -0.0623
    },
    "benchmark_comparison": {
      "benchmark_symbol": "SPY",
      "benchmark_cagr": 0.1256,
      "excess_return": -0.0132,
      "tracking_error": 0.0456,
      "information_ratio": -0.29,
      "beta": 0.87,
      "alpha": -0.0021,
      "r_squared": 0.92
    },
    "time_series": {
      "portfolio_values": [
        { "date": "2015-01-02", "value": 10000.00 },
        { "date": "2015-01-03", "value": 10023.45 },
        { "date": "2024-12-31", "value": 28456.78 }
      ],
      "drawdowns": [
        { "date": "2015-01-02", "drawdown": 0.0 },
        { "date": "2020-03-23", "drawdown": -0.1456 },
        { "date": "2024-12-31", "drawdown": 0.0 }
      ],
      "annual_returns": [
        { "year": 2015, "return": 0.0234 },
        { "year": 2016, "return": 0.0891 },
        { "year": 2024, "return": 0.1567 }
      ],
      "monthly_returns": [
        { "year": 2024, "month": 1, "return": 0.0234 },
        { "year": 2024, "month": 2, "return": -0.0156 }
      ]
    },
    "rolling_returns": {
      "1y": [
        { "date": "2024-12-31", "return": 0.1856 },
        { "date": "2024-11-30", "return": 0.1765 }
      ],
      "3y": [
        { "date": "2024-12-31", "return": 0.4231 },
        { "date": "2024-11-30", "return": 0.4156 }
      ]
    },
    "charts": {
      "performance": { "chart_type": "line", "data_url": "/charts/bt-uuid-1234/performance" },
      "drawdown": { "chart_type": "area", "data_url": "/charts/bt-uuid-1234/drawdown" },
      "annual_returns": { "chart_type": "bar", "data_url": "/charts/bt-uuid-1234/annual" }
    },
    "generated_at": "2026-03-11T10:30:00Z",
    "cached_until": "2026-03-11T11:30:00Z"
  }
}
```

---

### 3.2 取得回測結果

```http
GET /backtest/{backtest_id}
```

**Path Parameters**

| 參數 | 類型 | 說明 |
|------|------|------|
| backtest_id | string | 回測 ID |

**Response (200 OK)**
回應格式與 POST /backtest 相同。

---

### 3.3 執行蒙特卡羅模擬

```http
POST /backtest/monte-carlo
```

**Request Body**
```json
{
  "portfolio": {
    "holdings": [
      { "symbol": "VTI", "weight": 0.60 },
      { "symbol": "BND", "weight": 0.40 }
    ]
  },
  "parameters": {
    "years": 30,
    "initial_amount": 10000,
    "monthly_contribution": 500,
    "simulations": 1000,
    "confidence_levels": [0.5, 0.75, 0.9, 0.95]
  }
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "simulations": 1000,
    "years": 30,
    "projections": {
      "percentiles": {
        "5": { "final_value": 245678.23, "cagr": 0.0456 },
        "25": { "final_value": 456789.12, "cagr": 0.0789 },
        "50": { "final_value": 678901.34, "cagr": 0.1023 },
        "75": { "final_value": 912345.56, "cagr": 0.1234 },
        "95": { "final_value": 1234567.89, "cagr": 0.1456 }
      },
      "paths": [
        { "year": 1, "p5": 11234.56, "p25": 11567.89, "p50": 11987.65, "p75": 12456.78, "p95": 12987.43 },
        { "year": 30, "p5": 245678.23, "p25": 456789.12, "p50": 678901.34, "p75": 912345.56, "p95": 1234567.89 }
      ]
    },
    "success_probability": {
      "target_1m": 0.78,
      "target_2m": 0.45,
      "target_3m": 0.23
    }
  }
}
```

---

## 4. 投資組合 API

### 4.1 儲存投資組合

```http
POST /portfolios
```

**Request Body**
```json
{
  "name": "60/40 保守組合",
  "description": "經典的股債配置策略",
  "is_public": false,
  "holdings": [
    { "symbol": "VTI", "weight": 0.40 },
    { "symbol": "VXUS", "weight": 0.20 },
    { "symbol": "BND", "weight": 0.40 }
  ],
  "tags": ["conservative", "balanced"]
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "portfolio-uuid-5678",
    "name": "60/40 保守組合",
    "description": "經典的股債配置策略",
    "user_id": "user-1234",
    "is_public": false,
    "holdings": [
      { "symbol": "VTI", "name": "Vanguard Total Stock Market ETF", "weight": 0.40 },
      { "symbol": "VXUS", "name": "Vanguard Total International Stock ETF", "weight": 0.20 },
      { "symbol": "BND", "name": "Vanguard Total Bond Market ETF", "weight": 0.40 }
    ],
    "tags": ["conservative", "balanced"],
    "created_at": "2026-03-11T10:30:00Z",
    "updated_at": "2026-03-11T10:30:00Z"
  }
}
```

---

### 4.2 取得使用者投資組合

```http
GET /portfolios
```

**Query Parameters**

| 參數 | 類型 | 必填 | 說明 | 預設值 |
|------|------|------|------|--------|
| page | integer | 否 | 頁碼 | 1 |
| limit | integer | 否 | 每頁數量 | 20 |

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "portfolio-uuid-5678",
        "name": "60/40 保守組合",
        "description": "經典的股債配置策略",
        "holdings_count": 3,
        "is_public": false,
        "created_at": "2026-03-11T10:30:00Z",
        "updated_at": "2026-03-11T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

---

### 4.3 取得單一投資組合

```http
GET /portfolios/{portfolio_id}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "portfolio-uuid-5678",
    "name": "60/40 保守組合",
    "description": "經典的股債配置策略",
    "user_id": "user-1234",
    "is_public": false,
    "holdings": [
      { "symbol": "VTI", "name": "Vanguard Total Stock Market ETF", "weight": 0.40 },
      { "symbol": "VXUS", "name": "Vanguard Total International Stock ETF", "weight": 0.20 },
      { "symbol": "BND", "name": "Vanguard Total Bond Market ETF", "weight": 0.40 }
    ],
    "asset_allocation": {
      "Equity": 0.60,
      "Fixed Income": 0.40
    },
    "geographic_allocation": {
      "US": 0.56,
      "International": 0.24,
      "Bond": 0.40
    },
    "estimated_expense_ratio": 0.00042,
    "backtest_count": 12,
    "tags": ["conservative", "balanced"],
    "created_at": "2026-03-11T10:30:00Z",
    "updated_at": "2026-03-11T10:30:00Z"
  }
}
```

---

### 4.4 更新投資組合

```http
PUT /portfolios/{portfolio_id}
```

**Request Body**
```json
{
  "name": "更新後的名稱",
  "description": "更新的描述",
  "holdings": [
    { "symbol": "VTI", "weight": 0.50 },
    { "symbol": "BND", "weight": 0.50 }
  ]
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "portfolio-uuid-5678",
    "name": "更新後的名稱",
    "description": "更新的描述",
    "holdings": [...],
    "updated_at": "2026-03-11T11:00:00Z"
  }
}
```

---

### 4.5 刪除投資組合

```http
DELETE /portfolios/{portfolio_id}
```

**Response (204 No Content)**

---

## 5. 報告 API

### 5.1 匯出回測報告

```http
POST /reports/export
```

**Request Body**
```json
{
  "backtest_id": "bt-uuid-1234",
  "format": "pdf",
  "include_charts": true,
  "include_details": true,
  "language": "zh-TW"
}
```

**格式選項**: `pdf`, `excel`, `csv`, `json`

**Response (202 Accepted)**
```json
{
  "success": true,
  "data": {
    "export_id": "export-uuid-9999",
    "status": "processing",
    "format": "pdf",
    "estimated_completion": "2026-03-11T10:35:00Z",
    "download_url": null
  }
}
```

---

### 5.2 檢查匯出狀態

```http
GET /reports/export/{export_id}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "export_id": "export-uuid-9999",
    "status": "completed",
    "format": "pdf",
    "file_size": 2456789,
    "created_at": "2026-03-11T10:30:00Z",
    "completed_at": "2026-03-11T10:32:15Z",
    "download_url": "https://cdn.etfbacktester.com/reports/export-uuid-9999.pdf?token=xyz",
    "expires_at": "2026-03-11T11:32:15Z"
  }
}
```

---

## 6. 系統 API

### 6.1 健康檢查

```http
GET /health
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-03-11T10:30:00Z",
    "services": {
      "database": "connected",
      "redis": "connected",
      "external_api": "connected"
    },
    "system": {
      "uptime_seconds": 86400,
      "memory_usage_mb": 512,
      "cpu_usage_percent": 23
    }
  }
}
```

---

### 6.2 取得支援的 ETF 清單（快取版本）

```http
GET /system/supported-etfs
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "total_count": 40,
    "asset_classes": ["Equity", "Fixed Income", "REITs", "Commodities"],
    "regions": ["US", "Developed", "Emerging", "Global"],
    "last_updated": "2026-03-11T00:00:00Z",
    "etfs": [
      { "symbol": "VTI", "name": "Vanguard Total Stock Market ETF", "category": "US Equity" },
      { "symbol": "BND", "name": "Vanguard Total Bond Market ETF", "category": "US Bond" }
    ]
  }
}
```

---

## 7. 錯誤碼對照表

| 錯誤碼 | 說明 | HTTP 狀態碼 |
|--------|------|------------|
| INVALID_INPUT | 請求參數無效 | 400 |
| MISSING_REQUIRED_FIELD | 缺少必要欄位 | 400 |
| INVALID_DATE_RANGE | 日期範圍無效 | 400 |
| WEIGHT_SUM_NOT_100 | 權重總和不為 100% | 422 |
| ETF_NOT_FOUND | ETF 不存在 | 404 |
| INSUFFICIENT_DATA | 歷史資料不足 | 422 |
| RATE_LIMIT_EXCEEDED | 請求過於頻繁 | 429 |
| UNAUTHORIZED | 未認證 | 401 |
| FORBIDDEN | 權限不足 | 403 |
| INTERNAL_ERROR | 伺服器內部錯誤 | 500 |
| SERVICE_UNAVAILABLE | 服務暫時不可用 | 503 |

---

## 8. API 版本管理

### 8.1 版本策略

- URL Path 版本控制: `/api/v1/...`
- 向後相容性：每個版本至少支援 6 個月
- 棄用通知：提前 3 個月通知

### 8.2 版本歷史

| 版本 | 發布日期 | 主要變更 |
|------|---------|---------|
| v1.0 | 2026-03-11 | 初始版本 |
| v1.1 | - | 新增蒙特卡羅模擬 |
| v2.0 | - | 新增用戶認證、投資組合管理 |

---

## 9. SDK 與工具

### 9.1 Python SDK 範例

```python
from etf_backtester import Client

# 初始化客戶端
client = Client(api_key="your-api-key")

# 執行回測
result = client.backtest.run(
    holdings=[
        {"symbol": "VTI", "weight": 0.60},
        {"symbol": "BND", "weight": 0.40}
    ],
    start_date="2020-01-01",
    end_date="2024-12-31",
    initial_amount=10000
)

print(f"CAGR: {result.metrics.cagr:.2%}")
print(f"Sharpe Ratio: {result.metrics.sharpe_ratio:.2f}")
```

### 9.2 cURL 範例

```bash
# 執行回測
curl -X POST https://api.etfbacktester.com/api/v1/backtest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "portfolio": {
      "holdings": [
        {"symbol": "VTI", "weight": 0.60},
        {"symbol": "BND", "weight": 0.40}
      ]
    },
    "parameters": {
      "start_date": "2020-01-01",
      "end_date": "2024-12-31"
    }
  }'
```

---

**文件結束**

*本文件為 API 設計規格，實際實作時可能需要根據技術可行性調整。*
