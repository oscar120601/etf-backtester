# 開發交接文件

## 📅 會話記錄

### 2026-03-11 開發會話（第二部分）

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

- [x] **更新文件**
  - 完整的 README.md（安裝說明、使用指南）

#### 關鍵決策記錄
- **SQLite 方案**: 由於 Docker 無法使用，改用 SQLite 作為開發資料庫
- **技術棧調整**: 加入 MUI (Material-UI) 作為前端組件庫
- **回測邏輯**: 採用日度資料計算，支援靈活的再平衡策略

#### 待解決問題
- [ ] 需要填充真實 ETF 歷史價格資料
- [ ] 尚未進行前後端整合測試
- [ ] Python 依賴安裝仍有問題（暫時擱置）

---

### 2026-03-11 開發會話（第一部分）

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

### Week 1: 準備階段
- [x] 環境建置 - ✅ 已完成
- [x] 資料庫設計 - ✅ 已完成（含 Migration）
- [x] 後端 API 基礎 - ✅ 已完成（ETF CRUD + 回測 API）
- [x] 前端基礎 - ✅ 已完成（React + MUI + Chart.js）
- [x] 回測引擎 - ✅ 已完成
- [ ] 整合測試 - ⏳ 待進行（需要真實數據）
- [ ] 部署上線 - ⏳ 待進行

### 專案結構
```
etf-backtester/
├── backend/              ✅ FastAPI + 回測引擎
│   ├── app/
│   │   ├── api/v1/endpoints/backtest.py  ✅ 回測 API
│   │   ├── core/
│   │   │   ├── backtest_engine.py       ✅ 回測計算
│   │   │   └── metrics.py               ✅ 績效指標
│   │   └── schemas/backtest.py          ✅ Pydantic 模型
│   └── ...
├── frontend/             ✅ React + TypeScript
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Backtest.tsx             ✅ 回測頁面
│   │   │   └── ETFList.tsx              ✅ ETF 列表
│   │   ├── services/api.ts              ✅ API 服務
│   │   └── types/index.ts               ✅ TypeScript 類型
│   └── ...
├── docs/                 ✅ 4份技術文件
└── README.md             ✅ 專案說明
```

---

## 下一步行動（優先順序）

### 立即行動（下次對話）
1. [ ] 準備 ETF 歷史價格資料
2. [ ] 測試後端 API（使用 curl 或 Postman）
3. [ ] 測試前端與後端整合

### 近期任務（Week 1-2）
4. [ ] 資料匯入功能（CSV 或 API 同步）
5. [ ] 錯誤處理與邊界情況測試
6. [ ] 前端響應式設計優化
7. [ ] 加入 Loading 狀態與錯誤提示

### 中期任務（Week 3-4）
8. [ ] 蒙地卡羅模擬視覺化
9. [ ] 多組合比較功能
10. [ ] 報告匯出功能（PDF/CSV）
11. [ ] 部署到雲端（Railway/Vercel）

---

## 已知問題與風險

| 問題 | 嚴重程度 | 應對方式 |
|------|---------|---------|
| 缺乏歷史價格資料 | **高** | 需要手動準備或同步 Yahoo Finance 資料 |
| Python 依賴安裝緩慢 | 中 | 暫時擱置，使用 mock 數據測試前端 |
| 尚未進行整合測試 | 中 | 待有數據後優先測試 |
| Docker 無法使用 | 低 | 已改用 SQLite + 本地 Python |

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
| 回測頁面 | `frontend/src/pages/Backtest.tsx` | 回測 UI |

---

## 快速啟動指令

```bash
# 後端（需要 Python 環境）
cd backend
uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev
```

---

*最後更新: 2026-03-11*
