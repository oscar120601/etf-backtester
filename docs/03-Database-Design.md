# ETF 回測工具 - 資料庫設計文件

## 📋 文件資訊

| 項目 | 內容 |
|------|------|
| 文件版本 | v1.0 |
| 建立日期 | 2026-03-11 |
| 資料庫 | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 |

---

## 1. 資料庫架構總覽

### 1.1 資料表清單

| 資料表 | 說明 | 估計資料量 |
|--------|------|-----------|
| `etf_master` | ETF 基本資料 | ~100 筆 |
| `etf_prices` | ETF 歷史價格 | ~500 萬筆 |
| `etf_dividends` | ETF 配息記錄 | ~5 萬筆 |
| `portfolios` | 使用者投資組合 | ~10 萬筆 |
| `portfolio_holdings` | 投資組合持有標的 | ~50 萬筆 |
| `backtest_results` | 回測結果快取 | ~100 萬筆 |
| `users` | 使用者資料 | ~10 萬筆 |
| `data_sync_logs` | 資料同步日誌 | ~50 萬筆 |
| `etf_expansion_log` | ETF 擴充歷程 | ~500 筆 |

### 1.2 資料表關聯圖

```
┌──────────────────┐       ┌──────────────────┐
│   etf_master     │       │  etf_dividends   │
├──────────────────┤       ├──────────────────┤
│ PK: id           │       │ PK: id           │
│ symbol (unique)  │       │ FK: symbol       │
│ name             │       │ date             │
│ asset_class      │       │ amount           │
└────────┬─────────┘       └──────────────────┘
         │
         ▼
┌──────────────────┐
│   etf_prices     │
├──────────────────┤
│ PK: id           │
│ FK: symbol       │
│ date             │
│ adjusted_close   │
└──────────────────┘

┌──────────────────┐       ┌────────────────────┐
│      users       │       │    portfolios      │
├──────────────────┤       ├────────────────────┤
│ PK: id (uuid)    │       │ PK: id (uuid)      │
│ email (unique)   │       │ FK: user_id        │
│ password_hash    │       │ name               │
└──────────────────┘       └────────┬───────────┘
                                    │
                                    ▼
                           ┌────────────────────┐
                           │ portfolio_holdings │
                           ├────────────────────┤
                           │ PK: id             │
                           │ FK: portfolio_id   │
                           │ symbol             │
                           │ weight             │
                           └────────────────────┘
```

---

## 2. 資料表詳細設計

### 2.1 ETF 基本資料表 (etf_master)

```sql
CREATE TABLE etf_master (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_zh VARCHAR(200),
    issuer VARCHAR(100) NOT NULL,
    
    -- 分類資訊
    asset_class VARCHAR(50) NOT NULL,
    asset_subclass VARCHAR(50),
    factor_type VARCHAR(50),
    region VARCHAR(50),
    sector VARCHAR(100),
    
    -- 基本資訊
    expense_ratio DECIMAL(6,5) NOT NULL,
    inception_date DATE NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- 狀態與管理
    is_active BOOLEAN DEFAULT TRUE,
    is_recommended BOOLEAN DEFAULT FALSE,
    data_source VARCHAR(50) DEFAULT 'yahoo',
    
    -- 資料品質
    min_data_year INTEGER,
    liquidity_score INTEGER CHECK (liquidity_score BETWEEN 1 AND 5),
    risk_level INTEGER CHECK (risk_level BETWEEN 1 AND 5),
    
    -- 彈性標籤
    tags TEXT[],
    description TEXT,
    
    -- 追蹤指數資訊
    tracking_index_name VARCHAR(200),
    tracking_index_symbol VARCHAR(50),
    
    -- 時間戳
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    last_verified_at TIMESTAMP,
    
    -- 約束條件
    CONSTRAINT chk_expense_ratio CHECK (expense_ratio >= 0 AND expense_ratio <= 1)
);

-- 索引
CREATE INDEX idx_etf_asset_class ON etf_master(asset_class);
CREATE INDEX idx_etf_region ON etf_master(region);
CREATE INDEX idx_etf_is_active ON etf_master(is_active);
CREATE INDEX idx_etf_tags ON etf_master USING GIN(tags);
```

### 2.2 ETF 歷史價格表 (etf_prices)

```sql
-- 主表（使用分區）
CREATE TABLE etf_prices (
    id BIGSERIAL,
    symbol VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    
    -- 價格資料
    open DECIMAL(12,4),
    high DECIMAL(12,4),
    low DECIMAL(12,4),
    close DECIMAL(12,4),
    adjusted_close DECIMAL(12,4) NOT NULL,
    volume BIGINT,
    dividend DECIMAL(10,4) DEFAULT 0,
    
    -- 資料來源與品質
    data_source VARCHAR(50) DEFAULT 'yahoo',
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- 時間戳
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    PRIMARY KEY (id, date)
) PARTITION BY RANGE (date);

-- 建立分區（2024-2030）
DO $$
DECLARE
    current_year INT;
BEGIN
    FOR current_year IN 2024..2030 LOOP
        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS etf_prices_%s PARTITION OF etf_prices 
             FOR VALUES FROM (%L) TO (%L)',
            current_year,
            current_year || '-01-01',
            (current_year + 1) || '-01-01'
        );
    END LOOP;
END $$;

-- 索引
CREATE INDEX idx_prices_symbol_date ON etf_prices(symbol, date);
CREATE INDEX idx_prices_date ON etf_prices(date);
CREATE UNIQUE INDEX idx_prices_unique ON etf_prices(symbol, date);
```

### 2.3 使用者表 (users)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(100),
    
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'user',
    
    -- 偏好設定
    preferences JSONB DEFAULT '{}',
    
    -- 安全
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
```

### 2.4 投資組合表 (portfolios)

```sql
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    backtest_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_is_public ON portfolios(is_public);
CREATE INDEX idx_portfolios_tags ON portfolios USING GIN(tags);
```

### 2.5 投資組合持有標的表 (portfolio_holdings)

```sql
CREATE TABLE portfolio_holdings (
    id SERIAL PRIMARY KEY,
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    weight DECIMAL(5,4) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT chk_weight_range CHECK (weight >= 0 AND weight <= 1)
);

CREATE INDEX idx_holdings_portfolio_id ON portfolio_holdings(portfolio_id);
```

### 2.6 回測結果快取表 (backtest_results)

```sql
CREATE TABLE backtest_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- 回測設定
    parameters JSONB NOT NULL,
    portfolio_snapshot JSONB NOT NULL,
    summary JSONB NOT NULL,
    metrics JSONB NOT NULL,
    time_series JSONB,
    
    -- 快取控制
    cache_key VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP,
    
    -- 元資料
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT chk_parameters_not_empty CHECK (parameters <> '{}')
);

CREATE INDEX idx_backtest_portfolio_id ON backtest_results(portfolio_id);
CREATE INDEX idx_backtest_cache_key ON backtest_results(cache_key);
CREATE INDEX idx_backtest_expires_at ON backtest_results(expires_at);
```

---

## 3. 觸發器與函數

### 3.1 自動更新 updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 應用到各表
CREATE TRIGGER update_etf_master_updated_at 
    BEFORE UPDATE ON etf_master 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at 
    BEFORE UPDATE ON portfolios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 清理過期回測結果

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_backtest_results()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM backtest_results 
    WHERE expires_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. 效能優化

### 4.1 索引策略

```sql
-- 覆蓋索引
CREATE INDEX idx_etf_active_recommended ON etf_master(is_active, is_recommended) 
    INCLUDE (symbol, name, expense_ratio);

-- 部分索引
CREATE INDEX idx_etfs_us_equity ON etf_master(symbol, name) 
    WHERE asset_class = 'Equity' AND region = 'US';

-- 複合索引
CREATE INDEX idx_prices_symbol_date_close ON etf_prices(symbol, date, adjusted_close);
```

### 4.2 連線池設定

```python
from sqlalchemy import create_engine

engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=30,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True
)
```

---

**文件結束**
