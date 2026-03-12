# 開發交接文件

## 📅 會話記錄

### 2026-03-12 開發會話（第七部分：Week 2 完成 - 多組合比較 + 模板 + 存檔）

#### 已完成工作
- [x] **Week 2 Day 1-3: 多組合比較功能**
  - API: 新增 `/backtest/compare` 端點，並行比較最多 3 組組合
  - 前端: 建立 `Comparison.tsx` 頁面，並排顯示 3 組組合的績效指標
  - 功能: CAGR、夏普比率、最大回撤對比，相對報酬圖表

- [x] **Week 2 Day 2-3: 預設模板功能**
  - 建立 `PortfolioTemplates` 資料結構（6 種預設模板）
  - 建立 `TemplateSelector` 組件，一鍵套用經典配置
  - 建立 `ETFSelector` 組件，支援搜尋與多選
  - 模板已整合到 Backtest 頁面
  - 模板類型：
    - 經典 60/40（股票/債券平衡）
    - 全天候組合（All Weather）
    - 成長型組合（80/20）
    - 保守型組合（20/80）
    - 股息組合（SCHD + 價值股）
    - 全球平衡組合（美股 + 國際股 + 債券）

- [x] **Week 2 Day 4-5: 存檔功能**
  - 後端: 建立 `SavedBacktest` 模型與 `/saved-backtests` API 端點
  - 前端: 建立 `SaveBacktestDialog` 組件，儲存回測結果
  - 前端: 建立 `SavedBacktests` 頁面，管理已儲存的回測
  - 功能: 儲存、查看、編輯、刪除回測記錄

---

### 2026-03-12 開發會話（第六部分：Week 1 完成 - ETF 擴充 + 一鍵啟動）

#### 已完成工作
- [x] **Week 1 任務全部完成**
  - ETF 擴充：從 5 檔擴充到 **14 檔**
    - 美股新增：VUAA, AVUV, QMOM, SCHD
    - 英股新增：CNDX, EQQQ, AVWS, IUMO
    - 國際新增：VXUS
  - 每檔 ETF 約 1,550+ 筆日線資料（2020-01 到 2026-03）
  - 製作一鍵啟動腳本：start-dev.bat 與 start-dev.ps1

#### 目前 ETF 清單（14 檔）
| 類別 | 數量 | ETF |
|------|------|-----|
| 美股大盤 | 4 | VTI, VOO, VUAA, QQQ |
| 美股因子 | 4 | AVUV, QMOM, SCHD, IUMO |
| 英股 ETF | 2 | CNDX, EQQQ |
| 國際股票 | 2 | VT, VXUS |
| 債券 | 1 | BND |
| 國際價值 | 1 | AVWS |

---

### 2026-03-12 開發會話（第五部分：數據修復與 Monte Carlo 驗證）

#### 已完成工作
- [x] **修復 ETF 歷史價格數據異常**
  - 發現問題：VTI、VOO、QQQ、BND、VT 在 2025-01-02 出現價格跳躍異常
  - 錯誤數據：VTI 從 $81.19 跳到 $285.77（+251%）
  - 影響：Monte Carlo 模擬計算出 101% 年化波動率（正常應為 16%）
  - 修復：完全刪除並重新從 Yahoo Finance 下載正確價格數據
  
- [x] **驗證 Monte Carlo 模擬**
  - 30 年測試：初始 $10,000，每月定投 $500，VTI 100%
  - 修復前：95% 百分位數高達 $181M（不合理）
  - 修復後：95% 百分位數為 $5.97M（合理範圍）
  - 中位數：$1.66M（約 7.7% 年化報酬率，符合歷史平均）

#### 關鍵發現
| ETF | 修復前波動率 | 修復後波動率 | 狀態 |
|-----|-------------|-------------|------|
| VTI | 170.18% | 16.15% | ✅ 正常 |
| VOO | 177.94% | 15.52% | ✅ 正常 |
| QQQ | 169.74% | 20.55% | ✅ 正常 |
| BND | 107.98% | 4.90% | ✅ 正常（債券） |
| VT | 105.15% | 14.50% | ✅ 正常 |

---

### 2026-03-11 開發會話（第四部分：整合測試）

#### 已完成工作
- [x] **前後端整合測試**
  - 測試後端資料庫層：SQLite 連線成功
  - 資料表建立：`etf_master`, `etf_prices`
  - ETF 種子資料載入：5 檔 ETF（VTI, VOO, QQQ, BND, VT）
  - 修復模型相容性：將 PostgreSQL ARRAY 改為 SQLite 相容的 String
  - 建立 `app/api/deps.py` 依賴注入檔案

#### 發現的問題
- [ ] **Pydantic 版本衝突**導致 FastAPI 無法啟動
  - 錯誤：`cannot import name 'validate_core_schema' from 'pydantic_core'`
  - 原因：pydantic/pydantic-core/pydantic-settings 版本不相容
  - 解決方案：重新安裝相容版本（見下方指令）

---

### 2026-03-11 開發會話（第三部分：A+C+D）

#### 已完成工作
- [x] **A: 準備 ETF 歷史價格資料**
  - 創建 `data/etf_prices_sample.csv` 範例資料（VTI、VOO、QQQ、BND、VT）
  - 創建 `import_prices.py` 資料匯入腳本
  - 支援 CSV 匯入與模擬資料產生
  
- [x] **C: 前端優化**
  - 新增 `LoadingOverlay` 組件（全螢幕載入動畫）
  - 新增 `ErrorAlert` 組件（可關閉的錯誤提示）
  - 整合到現有頁面
  
- [x] **D: 蒙地卡羅模擬視覺化**
  - 創建 `MonteCarlo.tsx` 頁面
  - 多條百分位數路徑圖表（5%、25%、50%、75%、95%）
  - 目標達成機率計算
  - 關鍵年份預測表格
  - 新增側邊欄導航項目

---

### 2026-03-11 開發會話（第二部分：回測引擎）

#### 已完成工作
- [x] **回測引擎核心** (`BacktestEngine`)
  - 歷史數據回測計算
  - 支援多種再平衡策略（每月/每季/每年/閾值）
  - 定期定額投入模擬
  - 配息再投資邏輯
  
- [x] **績效指標計算** (`MetricsCalculator`)
  - 報酬率指標：總報酬、CAGR
  - 風險指標：波動率、最大回撤
  - 風險調整後報酬：夏普比率、索丁諾比率、卡瑪比率
  - 風險值：VaR 95%、CVaR 95%
  - 年度/月份統計

- [x] **回測 API 端點**
  - `POST /api/v1/backtest/run` - 執行回測
  - `POST /api/v1/backtest/monte-carlo` - 蒙地卡羅模擬
  - `GET /api/v1/backtest/supported-etfs` - 支援的 ETF 列表

- [x] **前端回測介面**
  - 投資組合配置表單（最多 10 檔 ETF）
  - 權重設定與即時驗證
  - 回測參數設定（日期、金額、再平衡）
  - Chart.js 價值走勢圖
  - 績效指標卡片展示
  - Material-UI 響應式設計

---

### 2026-03-11 開發會話（第一部分：專案建立）

#### 已完成工作
- [x] 審閱並更新 PRD（加入 ETF 擴充規劃）
- [x] 建立 4 份技術文件（架構、API、資料庫、開發計畫）
- [x] 建立完整開發環境：
  - Docker + Docker Compose 設定（未使用）
  - FastAPI 後端框架（ETF API）
  - React + TypeScript 前端
  - PostgreSQL 資料庫模型（已改用 SQLite）
  - Alembic Migration
  - 13 檔 ETF 種子資料
- [x] 建立啟動腳本（start-dev.ps1, start-simple.bat）

---

## 當前狀態

### 系統狀態總覽

```
┌─────────────────────────────────────────┐
│  前端 React 層   ✅ 完整實作              │
│  - ETFList 頁面   ✅                     │
│  - Backtest 頁面  ✅ (模板 + 儲存功能)   │
│  - MonteCarlo 頁面 ✅                    │
│  - Comparison 頁面 ✅                    │
│  - SavedBacktests 頁面 ✅ (新增)         │
│  - UI 組件        ✅                     │
├─────────────────────────────────────────┤
│  後端資料庫層    ✅ 正常運作              │
│  - SQLite 連線    ✅                     │
│  - 資料表建立     ✅                     │
│  - 種子資料       ✅  14檔ETF            │
│  - 價格數據       ✅  已修復（2020-2026）│
├─────────────────────────────────────────┤
│  後端 API 層     ✅ 正常運作              │
│  - FastAPI 啟動   ✅                     │
│  - 回測端點       ✅                     │
│  - Monte Carlo    ✅                     │
│  - 比較端點       ✅                     │
│  - 存檔端點       ✅  (新增)             │
├─────────────────────────────────────────┤
│  整合測試        ✅ 已完成                │
│  - API 連接測試   ✅                     │
│  - 數據驗證       ✅                     │
└─────────────────────────────────────────┘
```

### Week 1: 核心功能完成 ✅
- [x] 環境建置 - ✅ 已完成
- [x] 資料庫設計 - ✅ 已完成（SQLite 版本）
- [x] 後端 API 開發 - ✅ 已完成
- [x] 前端基礎 - ✅ 已完成
- [x] 回測引擎 - ✅ 已完成
- [x] 蒙地卡羅模擬 - ✅ 已完成
- [x] 資料匯入工具 - ✅ 已完成
- [x] 資料庫整合測試 - ✅ 已完成
- [x] **後端 API 啟動測試** - ✅ **已完成**
- [x] **前後端連接測試** - ✅ **已完成**
- [x] **價格數據修復** - ✅ **已完成（關鍵修復）**
- [x] **ETF 擴充到 14 檔** - ✅ **已完成**
- [x] **一鍵啟動腳本** - ✅ **已完成**

### Week 2: 增強功能 ✅ 全部完成
- [x] **多組合比較功能** - ✅ **已完成**
- [x] **預設模板資料結構** - ✅ **已完成**
- [x] **模板選擇器組件** - ✅ **已完成**
- [x] **模板整合到 Backtest 頁面** - ✅ **已完成**
- [x] **存檔功能** - ✅ **已完成**

- [ ] 部署上線 - ⏳ 待進行

---

## 下一步行動（優先順序）

### 🔥 立即行動（下次對話優先處理）

1. [x] ~~**修復 Pydantic 版本衝突**~~ ✅ 已完成
2. [x] ~~**啟動後端並測試 API**~~ ✅ 已完成
3. [x] ~~**啟動前端並進行完整功能測試**~~ ✅ 已完成
4. [x] ~~**修復價格數據異常**~~ ✅ 已完成

### 🎯 當前狀態：核心功能 + 多組合比較完成

系統已可正常運行：
- 前端：React + Vite 開發伺服器運行中（http://localhost:5173）
- 後端：FastAPI 運行中（http://localhost:8000）
- 資料庫：SQLite 含真實 ETF 價格數據（2020-2026，14檔 ETF）
- 功能：回測、Monte Carlo、多組合比較、預設模板

### 📋 近期任務（Week 3-4）

1. [ ] 報告匯出功能（PDF/CSV）
2. [ ] 資料同步機制（自動更新 ETF 價格）
3. [ ] 更多圖表類型（回撤圖、年度熱力圖）
4. [ ] 響應式設計優化（手機版適配）
5. [ ] 部署到雲端（Railway/Vercel）

### 🚀 中期任務（Week 3-4）

1. [ ] 報告匯出功能（PDF/CSV）
2. [ ] 資料同步機制（自動更新 ETF 價格）
3. [ ] 更多圖表類型（回撤圖、年度熱力圖）
4. [ ] 響應式設計優化（手機版適配）
5. [ ] 部署到雲端（Railway/Vercel）

---

## 已知問題與風險

| 問題 | 嚴重程度 | 狀態 | 應對方式 |
|------|---------|------|---------|
| ~~Pydantic 版本衝突~~ | ~~高~~ | ✅ 已修復 | 重新安裝相容版本 |
| ~~價格數據異常~~ | ~~高~~ | ✅ 已修復 | 重新從 Yahoo Finance 下載 |
| 尚未載入真實價格資料 | 中 | ✅ 已解決 | 已載入 2020-2026 真實價格 |
| 尚未進行 API 連接測試 | 中 | ✅ 已完成 | 前後端連接正常 |
| Docker 無法使用 | 低 | 🟢 已解決 | 已改用 SQLite + 本地 Python |

---

## 重要檔案位置

| 檔案 | 路徑 | 說明 |
|------|------|------|
| PRD | `PRD-ETF-Backtest-Tool.md` | 產品需求書 |
| 系統架構 | `docs/01-System-Architecture.md` | 技術架構 |
| API 文件 | `docs/02-API-Specification.md` | API 規格 |
| README | `README.md` | 專案說明與安裝指南 |
| 回測 API | `backend/app/api/v1/endpoints/backtest.py` | 回測端點 |
| 回測引擎 | `backend/app/core/backtest_engine.py` | 核心計算邏輯 |
| 績效指標 | `backend/app/core/metrics.py` | 指標計算 |
| 資料匯入 | `backend/app/db/import_prices.py` | 匯入腳本 |
| 範例資料 | `data/etf_prices_sample.csv` | ETF 價格範例 |
| 回測頁面 | `frontend/src/pages/Backtest.tsx` | 回測 UI |
| 蒙地卡羅 | `frontend/src/pages/MonteCarlo.tsx` | 蒙地卡羅 UI |
| 組合比較 | `frontend/src/pages/Comparison.tsx` | 多組合比較 UI |
| 我的回測 | `frontend/src/pages/SavedBacktests.tsx` | 已儲存回測 |
| 模板資料 | `frontend/src/data/portfolioTemplates.ts` | 預設模板 |
| 模板選擇器 | `frontend/src/components/TemplateSelector.tsx` | 模板組件 |
| 儲存對話框 | `frontend/src/components/SaveBacktestDialog.tsx` | 儲存回測 |
| ETF 選擇器 | `frontend/src/components/ETFSelector.tsx` | ETF 多選組件 |
| 存檔 API | `backend/app/api/v1/endpoints/saved_backtests.py` | 存檔端點 |
| 存檔模型 | `backend/app/models/saved_backtest.py` | 資料庫模型 |

---

## 快速啟動指令

### 修復並啟動後端

```bash
# 1. 進入後端目錄
cd backend

# 2. 修復 Pydantic 版本（如果還沒修復）
pip uninstall pydantic pydantic-core pydantic-settings -y
pip install pydantic==2.5.0 pydantic-core==2.14.0 pydantic-settings==2.1.0 fastapi==0.104.1

# 3. 初始化資料庫（如果還沒建立）
python -c "from app.db.base import Base; from app.db.session import engine; Base.metadata.create_all(bind=engine)"

# 4. 啟動後端伺服器
python -m uvicorn app.main:app --reload --port 8000

# 5. 測試 API（另一個終端）
curl http://localhost:8000/api/v1/etfs/
```

### 啟動前端

```bash
# 1. 進入前端目錄
cd frontend

# 2. 安裝依賴（第一次）
npm install

# 3. 啟動開發伺服器
npm run dev

# 4. 開啟瀏覽器訪問 http://localhost:5173
```

---

## 功能說明

### 資料匯入功能
```bash
# 從 CSV 匯入
python -m app.db.import_prices --csv data/etf_prices_sample.csv

# 產生模擬資料
python -m app.db.import_prices --generate --symbol VTI --start-date 2020-01-01 --end-date 2025-03-10
```

### 蒙地卡羅模擬
- 路徑：`/montecarlo`（側邊欄選單）
- 功能：預測未來投資組合可能的走勢
- 可調參數：年數、模擬次數、定期定額、目標金額
- 輸出：多條百分位數路徑、達成目標機率

---

## 測試狀態摘要

| 測試項目 | 結果 | 時間 |
|---------|------|------|
| 資料庫連線 | ✅ 通過 | 2026-03-11 |
| 資料表建立 | ✅ 通過 | 2026-03-11 |
| ETF 種子資料 | ✅ 通過 | 2026-03-11 |
| FastAPI 啟動 | ✅ 通過 | 2026-03-11 |
| API 端點測試 | ✅ 通過 | 2026-03-11 |
| 前端-後端連接 | ✅ 通過 | 2026-03-11 |
| **價格數據修復** | ✅ **通過** | **2026-03-12** |
| **Monte Carlo 驗證** | ✅ **通過** | **2026-03-12** |
| **多組合比較 API** | ✅ **通過** | **2026-03-12** |
| **比較頁面測試** | ✅ **通過** | **2026-03-12** |
| **模板組件測試** | ✅ **通過** | **2026-03-12** |
| **存檔 API 測試** | ✅ **通過** | **2026-03-12** |
| **我的回測頁面** | ✅ **通過** | **2026-03-12** |

---

## 🗓️ 改版計畫 (v0.4.0)

### 用戶反饋與規劃（2026-03-12）

| 問題 | 現況 | 計畫 | 時程 |
|------|------|------|------|
| ETF 數量不足 | 5 檔 | 擴充到 13 檔（含英股） | Week 1 |
| 啟動方式麻煩 | 手動 2 個終端機 | 一鍵啟動腳本 | Week 1 |
| 功能單一 | 只有回測+Monte Carlo | 多組合比較、報告匯出、模板 | Week 2-3 |

### 詳細規劃文件
- `ROADMAP-v0.4.0.md` - 完整 4 週開發計畫
- `QUICK_SUMMARY.md` - 快速摘要卡片

### 優先級矩陣
1. 🔥 **P0**: ETF 擴充到 13 檔、一鍵啟動腳本
2. 🎯 **P1**: 多組合比較、預設模板、報告匯出
3. 📌 **P2**: 更多圖表、壓力測試

---

*最後更新: 2026-03-12*  
*版本: v0.4.0 - Week 2 全部完成*  
*計畫版本: v0.4.0 - 4週改版計畫執行中（Week 2 進度 100%，Week 3 待開始）*
