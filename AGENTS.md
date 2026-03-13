# ETF 回測工具 - 開發指南

## 🎯 專案概述

這是一個**已達生產級**的 ETF 投資組合回測工具，支援美股與英股 ETF 的歷史績效分析。

**目前版本**: v1.0 (2026-03-13)  
**核心文件**:
- `README.md` - 使用說明與功能介紹
- `QUICK_SUMMARY.md` - 快速摘要
- `ROADMAP-v1.1.md` - 下一版本規劃
- `DEPLOY.md` - 部署指南
- `PRD-ETF-Backtest-Tool.md` - 產品需求書（歷史文件）

---

## 📋 技術棧

### 後端
- **框架**: FastAPI + Python 3.10+
- **資料庫**: SQLite（開發）/ PostgreSQL（生產）
- **ORM**: SQLAlchemy + Alembic Migrations
- **計算**: Pandas, NumPy, SciPy（優化）
- **資料匯入**: 支援 CSV 與 Yahoo Finance API

### 前端
- **框架**: React 18 + TypeScript（嚴格模式）
- **UI**: Material-UI v7
- **圖表**: Chart.js + chartjs-plugin-zoom
- **報告**: jsPDF, html2canvas, xlsx
- **狀態**: React Hooks + localStorage

---

## 📁 專案結構

```
backend/
├── app/
│   ├── api/v1/endpoints/     # API 路由
│   │   ├── backtest.py       # 回測引擎
│   │   ├── analysis.py       # 分析工具（滾動報酬、相關性）
│   │   ├── optimizer.py      # MPT 投資組合優化
│   │   ├── stress_test.py    # 壓力測試
│   │   └── ...
│   ├── core/                 # 核心計算引擎
│   │   ├── backtest.py       # 回測邏輯
│   │   ├── monte_carlo.py    # 蒙地卡羅模擬
│   │   ├── portfolio_optimizer.py  # MPT 優化
│   │   ├── stress_test.py    # 危機情境模擬
│   │   ├── rolling_returns.py      # 滾動報酬
│   │   ├── correlation_matrix.py   # 相關性分析
│   │   └── inflation_adjusted.py   # 通膨調整
│   ├── db/                   # 資料庫
│   │   ├── import_prices.py  # 價格資料匯入
│   │   ├── import_phase2_etfs.py   # ETF 資料匯入
│   │   └── base.py           # 基礎模型
│   ├── models/               # SQLAlchemy 模型
│   │   └── etf.py            # ETF 與價格模型
│   └── schemas/              # Pydantic 模型
├── import_phase2_prices.py   # Phase 2 ETF 價格生成
└── requirements.txt

frontend/
├── src/
│   ├── components/           # UI 組件
│   │   ├── BacktestCharts.tsx
│   │   ├── CorrelationHeatmap.tsx
│   │   ├── RollingReturnsChart.tsx
│   │   ├── DrawdownAnalysis.tsx
│   │   ├── ExportReport.tsx      # 報告匯出
│   │   ├── SavedPortfoliosManager.tsx  # 投資組合存檔
│   │   └── ...
│   ├── pages/                # 頁面
│   │   ├── Backtest.tsx
│   │   ├── Optimizer.tsx     # 投資組合優化
│   │   ├── Analysis.tsx      # 分析工具
│   │   ├── StressTest.tsx    # 壓力測試
│   │   ├── Comparison.tsx    # 多組合比較
│   │   └── MonteCarlo.tsx
│   ├── utils/                # 工具函數
│   │   ├── chartConfig.ts    # Chart.js zoom 配置
│   │   └── portfolioStorage.ts   # localStorage 操作
│   └── services/api.ts       # API 服務
└── package.json
```

---

## 🔗 ETF 清單（目前 22 檔）

### Phase 1（14 檔）- 核心配置
美股: VTI, VOO, VUAA, QQQ, AVUV, QMOM, SCHD  
英股: CNDX, EQQQ, AVWS, IUMO  
國際: VT, VXUS  
債券: BND

### Phase 2（8 檔）- 因子投資
價值: VTV, VBR  
成長: VUG, VBK  
股息: VIG, VYM, DGRO, HDV

---

## ⚙️ 開發規範

### 程式碼風格
- **TypeScript**: 嚴格模式，所有函數需有返回類型
- **Python**: Type hints + docstrings
- **API**: RESTful 設計，統一回應格式

### 資料庫變更
- 必須使用 Alembic Migration
- 禁止直接修改 production 資料庫

### API 變更
- 同步更新 API 文件
- 保持向後相容性或提供遷移指南

---

## 🛠️ 新增 ETF 流程

1. **編輯 `backend/app/db/import_phase2_etfs.py`**
   - 在 `PHASE2_ETFS` 陣列添加新 ETF 資料
   - 包含: symbol, name, factor_type, expense_ratio, inception_date 等

2. **執行匯入腳本**
   ```bash
   cd backend
   python -m app.db.import_phase2_etfs
   ```

3. **生成價格資料**
   ```bash
   python import_phase2_prices.py
   ```

4. **驗證資料**
   ```bash
   python -c "from app.db.session import SessionLocal; from app.models.etf import ETF; db = SessionLocal(); print(f'Total ETFs: {db.query(ETF).count()}')"
   ```

---

## 📊 核心功能說明

### 1. 回測引擎 (`core/backtest.py`)
- 計算投資組合歷史價值走勢
- 支援再平衡策略與定期定額
- 產生績效指標與時間序列數據

### 2. MPT 優化器 (`core/portfolio_optimizer.py`)
- 使用 SciPy 進行數值優化
- 支援多種目標函數（夏普比率、波動率等）
- 生成效率前緣曲線

### 3. 壓力測試 (`core/stress_test.py`)
- 預設 6 種危機情境
- 計算危機期間報酬與恢復時間
- 產生韌性評分

### 4. 分析工具
- **滾動報酬** (`rolling_returns.py`): 不同持有期間分析
- **相關性矩陣** (`correlation_matrix.py`): ETF 間相關性
- **通膨調整** (`inflation_adjusted.py`): 實質報酬計算

---

## 🚀 部署

### 開發環境
```bash
# Windows 一鍵啟動
start-dev.bat

# 或手動
cd backend && uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

### 生產環境
參見 `DEPLOY.md` 獲取 Railway + Vercel 部署指南。

---

## ⚠️ 重要提醒

1. **每次開發前**檢查對應的需求文件
2. **資料庫變更**必須使用 Alembic Migration
3. **API 變更**必須同步更新前端類型
4. **新增 ETF**遵循 Phase 擴充計畫
5. **遇到問題時**使用 `error-resolver` SKILL 進行診斷

---

*最後更新: 2026-03-13*

---

## 📊 最新狀態

### v1.0 已完成
- ✅ 22 檔 ETF 資料
- ✅ 完整回測引擎
- ✅ Monte Carlo 模擬
- ✅ 多組合比較
- ✅ MPT 投資組合優化
- ✅ 壓力測試（6 情境）
- ✅ 滾動報酬分析
- ✅ 相關性矩陣
- ✅ 通膨調整報酬
- ✅ 報告匯出（PDF/CSV/Excel）
- ✅ 投資組合存檔
- ✅ 互動圖表（zoom/pan/download）

### 開發中
- 🚀 v1.1: Phase 3 ETF 擴充（全球市場 + 債券）
