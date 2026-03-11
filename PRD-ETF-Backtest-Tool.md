# ETF 回測工具產品需求書 (PRD)

## 📋 文件資訊

| 項目 | 內容 |
|------|------|
| 文件版本 | v1.2 |
| 建立日期 | 2026-03-11 |
| 產品名稱 | ETF Portfolio Backtester |
| 目標平台 | Web Application |

---

## 1. 產品概述

### 1.1 產品願景
打造一個專業、直觀且**可擴充**的 ETF 投資組合回測工具，讓投資者能夠模擬不同資產配置策略在歷史市場表現，支援美股與英股 ETF，並具備彈性擴充更多標的的能力，協助投資決策。

### 1.2 設計原則
- **可擴充性**：ETF 清單可隨時擴充，無需修改核心程式碼
- **模組化**：各功能模組獨立，便於維護與擴展
- **資料驅動**：透過資料庫管理 ETF 清單，支援動態更新

### 1.3 目標用戶
- 長期投資者與指數投資者
- 財務規劃顧問
- 資產配置研究者
- 退休規劃需求者

### 1.4 核心價值
- **數據驅動決策**：基於真實歷史數據分析
- **風險視覺化**：清楚呈現投資組合風險特徵
- **跨市場分析**：同時支援美股與英股 ETF
- **易用性**：無需專業金融背景即可操作

---

## 2. 功能需求

### 2.1 核心功能模組

#### 2.1.1 投資組合設定 (Portfolio Configuration)

| 功能項目 | 需求描述 | 優先級 |
|---------|---------|--------|
| 多資產配置 | 支援最多 10 檔 ETF 組合配置 | P0 |
| 權重設定 | 每檔 ETF 可設定 0-100% 權重，總和需為 100% | P0 |
| 多組合比較 | 支援最多 3 組投資組合同時比較 | P1 |
| 預設模板 | 提供常見配置模板（如 60/40、全天候組合） | P2 |

#### 2.1.2 回測參數設定 (Backtest Parameters)

| 參數項目 | 需求描述 | 預設值 |
|---------|---------|--------|
| 初始投資金額 | 可設定起始資金（支援多幣別） | $10,000 USD |
| 回測起始日期 | 選擇回測開始年份 | 2000年 |
| 回測結束日期 | 選擇回測結束年份（可選至今） | 至今 |
| 再平衡頻率 | 支援多種再平衡策略 | 年度再平衡 |
| 現金流設定 | 支援定期定額/定值投入模擬 | P1 |

---

### 2.2 ETF 清單與擴充規劃

#### 2.2.1 初始上線 ETF (v1.0) - 13 檔

**美股 ETF (7檔)**
| 代碼 | 名稱 | 資產類別 | 費用率 | 成立日期 |
|------|------|---------|--------|---------|
| VTI | Vanguard Total Stock Market ETF | 美國全市場股票 | 0.03% | 2001-05-24 |
| VOO | Vanguard S&P 500 ETF | S&P 500 | 0.03% | 2010-09-07 |
| VUAA | Vanguard S&P 500 UCITS ETF (USD) Accumulating | S&P 500 累積型 | 0.07% | 2019-05-14 |
| QQQ | Invesco QQQ Trust | 納斯達克100 | 0.20% | 1999-03-10 |
| AVUV | Avantis U.S. Small Cap Value ETF | 美國小型價值股 | 0.25% | 2019-09-24 |
| QMOM | Alpha Architect U.S. Quantitative Momentum ETF | 美國動能股 | 0.79% | 2015-12-03 |
| SCHD | Schwab US Dividend Equity ETF | 美國高股息 | 0.06% | 2011-10-20 |

**英股/歐股 ETF (4檔)**
| 代碼 | 名稱 | 資產類別 | 費用率 | 成立日期 |
|------|------|---------|--------|---------|
| CNDX | iShares NASDAQ 100 UCITS ETF | 納斯達克100（英鎊） | 0.33% | 2010-01-29 |
| EQQQ | Invesco EQQQ NASDAQ-100 UCITS ETF | 納斯達克100（歐元） | 0.30% | 2000-01-14 |
| AVSV / AVWS | Avantis International Small Cap Value ETF | 國際小型價值股 | 0.36% | 2019-09-24 |
| IUMO | iShares MSCI USA Momentum Factor UCITS ETF | 美國動能因子 | 0.20% | 2015-01-29 |

**國際股票 ETF (1檔)**
| 代碼 | 名稱 | 資產類別 | 費用率 | 成立日期 |
|------|------|---------|--------|---------|
| VXUS | Vanguard Total International Stock ETF | 全球不含美國股票 | 0.08% | 2011-01-26 |

**債券 ETF (1檔)**
| 代碼 | 名稱 | 資產類別 | 費用率 | 成立日期 |
|------|------|---------|--------|---------|
| BND | Vanguard Total Bond Market ETF | 美國總體債券 | 0.03% | 2007-04-03 |

---

#### 2.2.2 ETF 擴充路線圖

| 階段 | 版本 | 預計時間 | 新增 ETF 數 | 重點類別 |
|------|------|---------|------------|---------|
| Phase 1 | v1.0 | 上線時 | 13 檔 | 核心股債配置 |
| Phase 2 | v1.2 | +1 個月 | +8 檔 | 因子投資、價值成長 |
| Phase 3 | v1.5 | +2 個月 | +7 檔 | 全球配置、新興市場 |
| Phase 4 | v2.0 | +4 個月 | +12 檔 | 債券完整、REITs、商品 |
| **總計** | | | **40+ 檔** | **完整資產配置** |

---

#### 2.2.3 Phase 2 規劃：因子投資擴充 (v1.2)

**價值/成長因子**
| 代碼 | 名稱 | 因子類型 | 費用率 |
|------|------|---------|--------|
| VTV | Vanguard Value ETF | 價值因子 | 0.04% |
| VUG | Vanguard Growth ETF | 成長因子 | 0.04% |
| VBR | Vanguard Small-Cap Value ETF | 小型價值 | 0.07% |
| VBK | Vanguard Small-Cap Growth ETF | 小型成長 | 0.07% |

**股息策略**
| 代碼 | 名稱 | 策略類型 | 費用率 |
|------|------|---------|--------|
| VIG | Vanguard Dividend Appreciation ETF | 股息成長 | 0.06% |
| VYM | Vanguard High Dividend Yield ETF | 高股息 | 0.06% |
| DGRO | iShares Core Dividend Growth ETF | 核心股息成長 | 0.08% |
| HDV | iShares Core High Dividend ETF | 核心高股息 | 0.08% |

---

#### 2.2.4 Phase 3 規劃：全球配置擴充 (v1.5)

**區域市場**
| 代碼 | 名稱 | 市場區域 | 費用率 |
|------|------|---------|--------|
| VEA | Vanguard Developed Markets ETF | 已開發市場（除美）| 0.05% |
| VWO | Vanguard Emerging Markets ETF | 新興市場 | 0.10% |
| VGK | Vanguard FTSE Europe ETF | 歐洲 | 0.11% |
| VPL | Vanguard FTSE Pacific ETF | 太平洋 | 0.08% |
| EWJ | iShares MSCI Japan ETF | 日本 | 0.50% |
| EWC | iShares MSCI Canada ETF | 加拿大 | 0.50% |
| IEFA | iShares Core MSCI EAFE ETF | 歐澳遠東 | 0.07% |

---

#### 2.2.5 Phase 4 規劃：資產類別完整化 (v2.0)

**債券 ETF 完整配置**
| 代碼 | 名稱 | 債券類型 | 費用率 |
|------|------|---------|--------|
| VGIT | Vanguard Intermediate-Term Treasury ETF | 中期公債 | 0.04% |
| VGSH | Vanguard Short-Term Treasury ETF | 短期公債 | 0.04% |
| VGLT | Vanguard Long-Term Treasury ETF | 長期公債 | 0.04% |
| VCIT | Vanguard Intermediate-Term Corp Bond ETF | 中期公司債 | 0.04% |
| VCSH | Vanguard Short-Term Corp Bond ETF | 短期公司債 | 0.04% |
| BNDX | Vanguard Total International Bond ETF | 國際債券 | 0.07% |
| VMBS | Vanguard Mortgage-Backed Securities ETF | MBS | 0.04% |
| VTEB | Vanguard Tax-Exempt Bond ETF | 免稅市政債 | 0.05% |
| SHV | iShares Short Treasury Bond ETF | 超短期公債 | 0.15% |
| TIP | iShares TIPS Bond ETF | 通膨保護債券 | 0.19% |

**替代性資產**
| 代碼 | 名稱 | 資產類別 | 費用率 |
|------|------|---------|--------|
| VNQ | Vanguard Real Estate ETF | REITs | 0.12% |
| GLD | SPDR Gold Trust | 黃金 | 0.40% |
| IAU | iShares Gold Trust | 黃金（低費用）| 0.25% |
| PFF | iShares Preferred and Income Securities ETF | 特別股 | 0.46% |

---

### 2.3 ETF 擴充管理機制

#### 2.3.1 擴充方式

| 擴充方式 | 適用場景 | 操作難度 | 所需時間 |
|---------|---------|---------|---------|
| **管理後台** | 日常新增/修改 | 低 | 2-5 分鐘 |
| **批次匯入** | Phase 升級時大量新增 | 中 | 30 分鐘 |
| **API 自動同步** | 與資料供應商整合 | 高（初期）| 自動化 |

#### 2.3.2 管理後台功能規格

**功能需求：**
- ETF 新增：輸入代碼後自動抓取名稱、發行商、費用率等資訊
- ETF 編輯：修改標的基本資料、啟用/停用狀態
- 批次操作：批次啟用/停用、批次匯入/匯出
- 資料驗證：自動檢查歷史資料完整性
- 分類管理：資產類別、因子類型、區域標籤管理

**介面元素：**
- 統計儀表板：顯示總 ETF 數、啟用/停用數、各類別分布
- 搜尋篩選：依代碼、名稱、類別、區域篩選
- 資料預覽：新增前預覽歷史資料可用範圍
- 操作日誌：記錄所有 ETF 異動

#### 2.3.3 擴充注意事項

| 檢查項目 | 說明 | 自動化程度 |
|---------|------|-----------|
| **歷史資料完整性** | 檢查是否有足夠歷史資料（建議 >5 年）| 自動檢查 |
| **資料來源可用性** | 確認 Yahoo Finance 或其他來源有此標的 | 自動檢查 |
| **幣別轉換** | 非 USD 標的需要匯率轉換邏輯 | 自動處理 |
| **配息資料** | 確認是否有配息記錄（影響總報酬計算）| 自動檢查 |
| **流動性檢查** | 確認日均交易量足夠（建議 >10萬股）| 警告提示 |
| **時間戳對齊** | 確認交易日與其他標的一致 | 自動處理 |

#### 2.3.4 完整 ETF 分類架構

```
ETF 分類樹狀結構

股票類 (Equity)
├── 美國市場
│   ├── 全市場 (Total Market) - VTI
│   ├── 大型股 (Large Cap) - VOO, VUAA
│   ├── 中型股 (Mid Cap) - VO
│   ├── 小型股 (Small Cap) - VB, AVUV
│   ├── 成長股 (Growth) - VUG
│   ├── 價值股 (Value) - VTV
│   ├── 科技股 (Tech) - QQQ, CNDX, EQQQ
│   ├── 股息成長 (Div Growth) - VIG, SCHD
│   └── 高股息 (High Div) - VYM
│
├── 國際市場
│   ├── 已開發市場 (Developed) - VEA, VXUS
│   ├── 新興市場 (Emerging) - VWO
│   ├── 歐洲 (Europe) - VGK
│   ├── 亞太 (Pacific) - VPL
│   └── 單一國家 (Single Country) - EWJ, EWC
│
└── 因子策略 (Factor)
    ├── 價值因子 (Value) - VTV, VBR
    ├── 成長因子 (Growth) - VUG, VBK
    ├── 動能因子 (Momentum) - QMOM, IUMO
    ├── 品質因子 (Quality) - QUAL
    └── 低波動 (Low Volatility) - USMV

債券類 (Fixed Income)
├── 美國公債 (Treasury)
│   ├── 短期 (Short) - VGSH, SHV
│   ├── 中期 (Intermediate) - VGIT
│   └── 長期 (Long) - VGLT
│
├── 投資級公司債 (Investment Grade Corp)
│   ├── 短期 - VCSH
│   └── 中期 - VCIT
│
├── 綜合債券 (Aggregate) - BND
├── 國際債券 (International) - BNDX
├── 通膨保護債 (TIPS) - TIP
└── 抵押債券 (MBS) - VMBS

不動產類 (Real Estate) - VNQ

商品類 (Commodities)
├── 黃金 (Gold) - GLD, IAU
└── 原油 (Oil) - USO

特別股 (Preferred Stock) - PFF
```

---

### 2.4 分析與報告功能

#### 2.4.1 績效指標計算 (Performance Metrics)

| 指標類別 | 具體指標 | 說明 |
|---------|---------|------|
| **總報酬** | 累積報酬率 | 整個回測期間的總報酬 |
| | 年化報酬率 (CAGR) | Compound Annual Growth Rate |
| | 最佳/最差年度報酬 | 單年度極值 |
| **風險指標** | 標準差 (波動率) | 年化報酬率標準差 |
| | 最大回撤 (Max Drawdown) | 從高點到低點的最大跌幅 |
| | 夏普比率 (Sharpe Ratio) | 風險調整後報酬 |
| | 索丁諾比率 (Sortino Ratio) | 下行風險調整後報酬 |
| **風險調整** | 卡瑪比率 (Calmar Ratio) | 年化報酬/最大回撤 |
| | 特瑞諾比率 (Treynor Ratio) | 系統風險調整後報酬 |

#### 2.4.2 基準比較 (Benchmark Comparison)

| 功能 | 需求描述 |
|------|---------|
| 基準選擇 | 可選擇基準指數進行比較 |
| 相對報酬 | 顯示相對於基準的超額報酬 |
| 追蹤誤差 | 計算與基準的追蹤誤差 |

**預設基準選項**
- S&P 500 (SPY)
- 全球股市 (VT)
- 60/40 股債組合
- 純債券組合 (BND)

#### 2.4.3 圖表視覺化 (Data Visualization)

| 圖表類型 | 功能描述 |
|---------|---------|
| 累積報酬曲線圖 | 顯示投資組合價值隨時間變化 |
| 年度報酬柱狀圖 | 逐年報酬率比較 |
| 滾動報酬分析 | 1年/3年/5年滾動報酬分布 |
| 回撤分析圖 | 顯示歷史回撤幅度與持續時間 |
| 資產配置圓餅圖 | 視覺化資產配置比例 |
| 相關性矩陣熱力圖 | 顯示各 ETF 間的相關性 |

---

### 2.5 進階功能

| 功能 | 描述 | 優先級 |
|------|------|--------|
| Monte Carlo 模擬 | 使用蒙地卡羅方法模擬未來報酬分布 | P2 |
| 壓力測試 | 模擬特定市場危機情境下的表現 | P2 |
| 稅務影響分析 | 估算不同稅務情境對報酬的影響 | P3 |
| 通膨調整 | 顯示實質報酬（通膨調整後） | P2 |
| 存檔功能 | 儲存/載入投資組合設定 | P1 |
| 匯出報告 | 匯出 PDF/Excel/CSV 格式報告 | P1 |

---

## 3. 技術需求

### 3.1 資料來源

| 資料類型 | 建議來源 | 更新頻率 |
|---------|---------|---------|
| ETF 價格數據 | Yahoo Finance API / Alpha Vantage | 日頻 |
| ETF 基本面資料 | Morningstar / ETF.com | 月頻 |
| 配息資料 | 各發行商官網 | 季度 |
| 歷史數據 | 至少 20 年歷史資料 | - |

### 3.2 技術架構

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Web UI)                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │  React/Vue   │ │  Chart.js    │ │  Tailwind CSS        │ │
│  │  Component   │ │  D3.js       │ │  Responsive Design   │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │  Python      │ │  FastAPI     │ │  Pandas/Numpy        │ │
│  │  Calculation │ │  REST API    │ │  Financial Analysis  │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │  PostgreSQL  │ │  Redis Cache │ │  External APIs       │ │
│  │  Time-series │ │  Price Data  │ │  Yahoo/Alpha         │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 計算邏輯需求

| 計算項目 | 公式/方法 |
|---------|----------|
| 總報酬率 | (期末價值 - 期初價值 + 配息) / 期初價值 |
| 年化報酬率 (CAGR) | (期末價值/期初價值)^(1/年數) - 1 |
| 標準差 | 日報酬率年化標準差 x √252 |
| 夏普比率 | (投組報酬率 - 無風險利率) / 投組標準差 |
| 最大回撤 | max(1 - 當前價值/歷史最高價值) |
| 滾動報酬 | 移動窗口計算年化報酬率 |

### 3.4 效能需求

| 項目 | 需求規格 |
|------|---------|
| 回測計算時間 | < 3 秒（10 年資料） |
| 頁面載入時間 | < 2 秒 |
| 圖表渲染時間 | < 1 秒 |
| 同時支援用戶 | 1000+ concurrent users |
| 資料更新延遲 | < 24 小時 |

---

## 4. UI/UX 設計需求

### 4.1 介面架構

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar: Logo | ETF Backtester | Language | Help | Login        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐    ┌────────────────────────────────┐ │
│  │  側邊設定面板        │    │        主要圖表區域              │ │
│  │                     │    │                                │ │
│  │  • 投資組合設定      │    │   [累積報酬曲線圖]              │ │
│  │  • ETF 選擇器        │    │                                │ │
│  │  • 權重調整滑桿      │    ├────────────────────────────────┤ │
│  │  • 時間範圍選擇      │    │   [年度報酬柱狀圖]              │ │
│  │  • 再平衡設定        │    │                                │ │
│  │  • 進階選項          │    ├────────────────────────────────┤ │
│  │                     │    │   [績效指標總覽]               │ │
│  │  [開始回測按鈕]      │    │                                │ │
│  └─────────────────────┘    └────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              詳細數據表格與報告下載                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 響應式設計

| 裝置類型 | 布局調整 |
|---------|---------|
| Desktop (>1200px) | 雙欄布局：側邊設定 + 主圖表區 |
| Tablet (768-1200px) | 單欄布局，設定區可折疊 |
| Mobile (<768px) | 單欄布局，步驟式設定流程 |

### 4.3 使用者流程

```
進入首頁 → 設定投資組合 → 選擇 ETF 標的 → 調整權重比例 
    ↓
選擇時間範圍 → 選擇基準比較 → 執行回測 → 顯示結果圖表
    ↓
查看詳細指標 → 匯出報告
```

---

## 5. 資料需求

### 5.1 資料庫 Schema（支援擴充版本）

```sql
-- ETF 基本資料表（擴充支援版本）
CREATE TABLE etf_master (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_zh VARCHAR(200),                    -- 中文名稱
    issuer VARCHAR(100),
    asset_class VARCHAR(50),                 -- 大類：Equity/Bond/REIT/Commodity
    asset_subclass VARCHAR(50),              -- 子類：US Large Cap / Treasury / etc.
    factor_type VARCHAR(50),                 -- 因子類型：Value/Growth/Momentum/Quality
    region VARCHAR(50),                      -- 區域：US/Developed/Emerging/Global
    sector VARCHAR(100),                     -- 產業（選填）
    expense_ratio DECIMAL(5,4),
    inception_date DATE,
    exchange VARCHAR(20),
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT TRUE,
    is_recommended BOOLEAN DEFAULT FALSE,
    data_source VARCHAR(50) DEFAULT 'yahoo', -- yahoo/alpha_vantage/bloomberg
    min_data_year INTEGER DEFAULT 2000,      -- 資料起始年份
    liquidity_score INTEGER,                 -- 流動性評分 1-5
    risk_level INTEGER,                      -- 風險等級 1-5
    tags TEXT[],                             -- 標籤陣列，彈性分類
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,                      -- 管理員 ID
    last_verified_at TIMESTAMP               -- 最後資料驗證時間
);

-- 自動更新 updated_at 時間戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_etf_master_updated_at 
    BEFORE UPDATE ON etf_master 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 歷史價格資料表
CREATE TABLE etf_prices (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) REFERENCES etf_master(symbol),
    date DATE NOT NULL,
    open DECIMAL(12,4),
    high DECIMAL(12,4),
    low DECIMAL(12,4),
    close DECIMAL(12,4),
    adjusted_close DECIMAL(12,4),
    volume BIGINT,
    dividend DECIMAL(10,4),
    UNIQUE(symbol, date)
);

-- ETF 擴充歷程記錄
CREATE TABLE etf_expansion_log (
    id SERIAL PRIMARY KEY,
    phase VARCHAR(20),                       -- Phase 1/2/3/4
    version VARCHAR(10),                     -- v1.0/v1.2/etc
    symbol VARCHAR(20),
    action VARCHAR(20),                      -- ADD/UPDATE/REMOVE
    performed_by INTEGER,
    performed_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- 使用者投資組合表
CREATE TABLE portfolios (
    id UUID PRIMARY KEY,
    user_id UUID,
    name VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- 投資組合持有標的表
CREATE TABLE portfolio_holdings (
    id SERIAL PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios(id),
    symbol VARCHAR(20),
    weight DECIMAL(5,2),
    created_at TIMESTAMP
);

-- 回測結果快取表
CREATE TABLE backtest_results (
    id UUID PRIMARY KEY,
    portfolio_id UUID,
    parameters JSONB,
    start_date DATE,
    end_date DATE,
    metrics JSONB,
    created_at TIMESTAMP,
    expires_at TIMESTAMP
);
```

### 5.2 API 端點規格

| 端點 | 方法 | 描述 |
|------|------|------|
| /api/etfs | GET | 取得所有支援的 ETF 清單 |
| /api/etfs/{symbol}/prices | GET | 取得特定 ETF 歷史價格 |
| /api/etfs/{symbol}/metrics | GET | 取得 ETF 基本面指標 |
| /api/backtest | POST | 執行回測計算 |
| /api/portfolios | GET/POST | 取得/建立投資組合 |
| /api/portfolios/{id} | GET/PUT/DELETE | 投資組合 CRUD |
| /api/reports/{id}/export | GET | 匯出回測報告 |

### 5.3 批次新增 ETF 腳本範例

```python
# batch_import_etfs.py - 批次匯入 ETF 範例
import pandas as pd
from database import get_db_connection

etf_data = [
    # Phase 2: 因子投資
    {"symbol": "VTV", "name": "Vanguard Value ETF", "asset_class": "Equity", 
     "asset_subclass": "US Large Cap", "factor_type": "Value", "expense_ratio": 0.0004},
    {"symbol": "VUG", "name": "Vanguard Growth ETF", "asset_class": "Equity", 
     "asset_subclass": "US Large Cap", "factor_type": "Growth", "expense_ratio": 0.0004},
    {"symbol": "VIG", "name": "Vanguard Dividend Appreciation ETF", "asset_class": "Equity", 
     "asset_subclass": "US Large Cap", "factor_type": "Dividend Growth", "expense_ratio": 0.0006},
    {"symbol": "VYM", "name": "Vanguard High Dividend Yield ETF", "asset_class": "Equity", 
     "asset_subclass": "US Large Cap", "factor_type": "High Dividend", "expense_ratio": 0.0006},
    
    # Phase 3: 全球配置
    {"symbol": "VEA", "name": "Vanguard Developed Markets ETF", "asset_class": "Equity", 
     "asset_subclass": "International Developed", "region": "Developed", "expense_ratio": 0.0005},
    {"symbol": "VWO", "name": "Vanguard Emerging Markets ETF", "asset_class": "Equity", 
     "asset_subclass": "Emerging Markets", "region": "Emerging", "expense_ratio": 0.0010},
]

def batch_import_etfs(etf_list, phase="Phase 2"):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for etf in etf_list:
        # 檢查是否已存在
        cursor.execute("SELECT id FROM etf_master WHERE symbol = %s", (etf["symbol"],))
        if cursor.fetchone():
            print(f"ETF {etf['symbol']} 已存在，跳過")
            continue
        
        # 插入新 ETF
        cursor.execute("""
            INSERT INTO etf_master (symbol, name, asset_class, asset_subclass, 
                                   factor_type, region, expense_ratio, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
        """, (etf["symbol"], etf["name"], etf["asset_class"], 
              etf.get("asset_subclass"), etf.get("factor_type"), 
              etf.get("region"), etf["expense_ratio"]))
        
        # 記錄擴充歷程
        cursor.execute("""
            INSERT INTO etf_expansion_log (phase, symbol, action, notes)
            VALUES (%s, %s, 'ADD', 'Batch import')
        """, (phase, etf["symbol"]))
        
        print(f"新增 ETF: {etf['symbol']} - {etf['name']}")
    
    conn.commit()
    conn.close()

# 執行批次匯入
batch_import_etfs(etf_data, phase="Phase 2")
```

---

## 6. 非功能需求

### 6.1 安全性

| 項目 | 需求 |
|------|------|
| 資料加密 | 敏感資料傳輸使用 HTTPS/TLS 1.3 |
| API 限制 | 每 IP 每分鐘最多 60 次請求 |
| 輸入驗證 | 防止 SQL Injection 與 XSS |
| CORS 設定 | 嚴格的跨來源資源共享政策 |

### 6.2 可靠性

| 項目 | 需求 |
|------|------|
| 可用性 | 99.9% SLA |
| 資料備份 | 每日自動備份 |
| 錯誤處理 | 優雅的錯誤提示與重試機制 |
| 快取策略 | Redis 快取熱門查詢結果 |

### 6.3 擴展性

| 項目 | 需求 |
|------|------|
| 水平擴展 | 支援 Kubernetes 自動擴展 |
| 資料分區 | 按時間分區歷史價格資料 |
| CDN 加速 | 靜態資源使用 CDN 分發 |

---

## 7. 風險與假設

### 7.1 技術風險

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| 資料來源中斷 | 高 | 多來源備援機制 |
| 計算效能不足 | 中 | 非同步處理與快取優化 |
| 匯率波動計算 | 中 | 明確標示幣別與匯率假設 |

### 7.2 商業風險

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| 資料授權成本 | 中 | 評估免費 API 方案 |
| 法規遵循 | 中 | 免責聲明與教育性質標示 |

### 7.3 重要假設

1. **過去績效不代表未來報酬**：工具僅供參考，不構成投資建議
2. **資料品質**：假設外部資料來源準確且及時
3. **市場效率**：假設 ETF 能準確追蹤指數表現
4. **交易成本**：預設不考慮交易成本與滑價

---

## 8. 附錄

### 8.1 術語表

| 術語 | 定義 |
|------|------|
| ETF | Exchange-Traded Fund，交易所交易基金 |
| CAGR | Compound Annual Growth Rate，複合年成長率 |
| Sharpe Ratio | 夏普比率，衡量風險調整後報酬 |
| Drawdown | 回撤，從高點到低點的跌幅 |
| Rebalancing | 再平衡，調整投資組合至目標權重 |
| UCITS | Undertakings for Collective Investment in Transferable Securities，歐盟可轉讓證券集體投資計劃 |

### 8.2 參考資源

- Portfolio Visualizer (https://www.portfoliovisualizer.com) - 主要參考網站
- Vanguard ETF 清單 (https://investor.vanguard.com/etf/list)
- iShares ETF 清單 (https://www.ishares.com/us/products/etf-overview)
- Alpha Architect (https://www.alphaarchitect.com)

### 8.3 完整 ETF 擴充檢查清單

**新增 ETF 前檢查：**
- [ ] 確認資料來源有此標的歷史價格
- [ ] 確認成立日期與資料起始日
- [ ] 確認配息記錄完整
- [ ] 確認幣別（USD/GBP/EUR）
- [ ] 確認費用率資訊
- [ ] 確認流動性（日均交易量）
- [ ] 分類標籤設定正確
- [ ] 資料驗證通過（無異常跳空）

---

## 9. 功能優先級總覽

### P0 (必要功能 - MVP)
- [x] 基本投資組合設定（最多10檔ETF）
- [x] 權重調整與驗證（總和100%）
- [x] 時間範圍選擇
- [x] 支援 13 檔初始 ETF
- [x] 總報酬率計算
- [x] 年化報酬率 (CAGR)
- [x] 最大回撤計算
- [x] 標準差計算
- [x] 累積報酬曲線圖
- [x] 年度報酬柱狀圖

### P1 (重要功能)
- [ ] 多組合比較（最多3組）
- [ ] 基準比較功能
- [ ] 夏普比率計算
- [ ] 定期定額模擬
- [ ] 投資組合存檔功能
- [ ] 報告匯出（PDF/CSV）

### P2 (進階功能)
- [ ] 滾動報酬分析
- [ ] 相關性矩陣
- [ ] Monte Carlo 模擬
- [ ] 壓力測試
- [ ] 通膨調整報酬

### P3 (未來功能)
- [ ] 稅務影響分析
- [ ] AI 投資建議
- [ ] 社交功能（分享組合）
- [ ] 手機 App

### ETF 擴充時間表
- [x] **Phase 1** (v1.0): 13 檔核心 ETF - 上線時
- [ ] **Phase 2** (v1.2): +8 檔因子投資 ETF - +1個月
- [ ] **Phase 3** (v1.5): +7 檔全球配置 ETF - +2個月
- [ ] **Phase 4** (v2.0): +12 檔完整資產類別 - +4個月

---

**文件結束**

*本文件為產品需求規格書，實際開發時可能需要根據技術可行性進行調整。*
