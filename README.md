# ETF Backtester

[![GitHub](https://img.shields.io/badge/GitHub-etf--backtester-blue?logo=github)](https://github.com/oscar120601/etf-backtester)
[![Version](https://img.shields.io/badge/version-v1.0.0-green)](./CHANGELOG.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-green?logo=fastapi)](https://fastapi.tiangolo.com/)

一個專業級的 ETF 投資組合回測與分析工具，使用 FastAPI + React + TypeScript 開發。

**🚀 在線演示**: 部署至 Railway + Vercel（參見 [DEPLOY.md](./DEPLOY.md)）

## 功能特色

### 📊 核心功能
- **歷史回測**：根據歷史數據回測投資組合表現
- **蒙地卡羅模擬**：預測未來可能的投資組合走勢（10-50年）
- **多組合比較**：同時比較最多 3 組投資組合
- **投資組合優化**：基於現代投資組合理論（MPT）的效率前緣分析
- **壓力測試**：模擬 6 種歷史危機情境下的表現

### 📈 分析工具
- **滾動報酬分析**：1/3/5/10 年滾動期間的報酬分布
- **相關性矩陣**：ETF 間價格相關性熱力圖
- **回撤分析**：歷史回撤幅度、持續時間、恢復統計
- **通膨調整**：計算實質報酬與購買力變化
- **月度/年度熱力圖**：視覺化呈現各期間報酬

### 💼 實用功能
- **報告匯出**：PDF、CSV、Excel 多格式支援
- **投資組合存檔**：使用 localStorage 儲存多個配置
- **預設模板**：60/40、全天候、科技股集中等一鍵套用
- **互動圖表**：支援縮放、平移、下載
- **因子篩選**：按價值、成長、股息等因子分類

## 支援的 ETF

目前支援 **22 檔** ETF：

### 美股大盤
| 代碼 | 名稱 | 類型 |
|------|------|------|
| VTI | Vanguard Total Stock Market ETF | 全市場 |
| VOO | Vanguard S&P 500 ETF | S&P 500 |
| VUAA | Vanguard S&P 500 UCITS ETF | 累積型 |

### 科技成長
| 代碼 | 名稱 | 類型 |
|------|------|------|
| QQQ | Invesco QQQ Trust | 納斯達克100 |
| CNDX | iShares NASDAQ 100 UCITS ETF | 英鎊計價 |
| EQQQ | Invesco EQQQ NASDAQ-100 UCITS ETF | 歐元計價 |

### 因子投資
| 代碼 | 名稱 | 類型 |
|------|------|------|
| VTV | Vanguard Value ETF | 大型價值 |
| VUG | Vanguard Growth ETF | 大型成長 |
| VBR | Vanguard Small-Cap Value ETF | 小型價值 |
| VBK | Vanguard Small-Cap Growth ETF | 小型成長 |
| AVUV | Avantis U.S. Small Cap Value ETF | 小型價值（進階）|
| QMOM | Alpha Architect U.S. Quantitative Momentum ETF | 動能 |
| IUMO | iShares MSCI USA Momentum Factor UCITS ETF | 動能因子 |

### 股息策略
| 代碼 | 名稱 | 類型 |
|------|------|------|
| SCHD | Schwab US Dividend Equity ETF | 股息貴族 |
| VIG | Vanguard Dividend Appreciation ETF | 股息成長 |
| VYM | Vanguard High Dividend Yield ETF | 高股息 |
| DGRO | iShares Core Dividend Growth ETF | 核心股息成長 |
| HDV | iShares Core High Dividend ETF | 核心高股息 |

### 債券與國際
| 代碼 | 名稱 | 類型 |
|------|------|------|
| BND | Vanguard Total Bond Market ETF | 總債券市場 |
| VT | Vanguard Total World Stock ETF | 全球股票 |
| VXUS | Vanguard Total International Stock ETF | 國際股票 |
| AVWS | Avantis International Small Cap Value ETF | 國際小型價值 |

## 技術架構

### 後端
- **FastAPI**：現代、快速的 Python Web 框架
- **SQLAlchemy**：ORM 資料庫操作
- **SQLite**：開發環境（可升級至 PostgreSQL）
- **Pandas/NumPy**：數據處理與計算
- **SciPy**：投資組合優化計算

### 前端
- **React 18**：使用者介面框架
- **TypeScript**：型別安全的 JavaScript
- **Material-UI (MUI)**：現代化 UI 組件庫
- **Chart.js + react-chartjs-2**：圖表繪製
- **chartjs-plugin-zoom**：圖表互動功能

## 快速開始

### 系統需求
- Python 3.10+
- Node.js 18+

### Windows 一鍵啟動（推薦）

```bash
# 最簡單的啟動方式
start-dev.bat

# 或 PowerShell 進階版（彩色輸出、自動開瀏覽器）
powershell -ExecutionPolicy Bypass -File start-dev.ps1
```

### 手動啟動

#### 1. 設定後端

```bash
cd backend

# 建立虛擬環境
python -m venv venv
venv\Scripts\activate  # Windows

# 安裝依賴
pip install -r requirements.txt

# 啟動開發伺服器
uvicorn app.main:app --reload --port 8000
```

#### 2. 設定前端

```bash
cd frontend

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

#### 3. 開啟瀏覽器

- 前端: http://localhost:5173
- API 文件: http://localhost:8000/docs

## 使用指南

### 1. 投資組合回測

1. 點擊「投資組合回測」頁面
2. 選擇 ETF 並設定權重（總和需為 100%）
3. 設定回測參數（日期、初始金額、再平衡頻率）
4. 點擊「執行回測」
5. 查看績效摘要與圖表分析

### 2. 投資組合優化

1. 點擊「投資組合優化」頁面
2. 選擇 2-10 檔 ETF
3. 選擇優化目標（最大夏普比率、最小波動率等）
4. 查看效率前緣與最佳配置建議

### 3. 多組合比較

1. 點擊「多組合比較」頁面
2. 設定最多 3 組投資組合
3. 執行比較查看並排結果

### 4. 風險分析

- **壓力測試**：測試組合在歷史危機中的表現
- **滾動報酬**：分析不同持有期間的報酬分布
- **相關性分析**：檢視 ETF 間的相關性

### 5. 報告匯出

回測結果支援三種格式匯出：
- **PDF**：完整報告含圖表
- **CSV**：時間序列數據
- **Excel**：多工作表詳細分析

## API 端點

### ETF 管理
- `GET /api/v1/etfs/` - 取得所有 ETF
- `GET /api/v1/etfs/{symbol}` - 取得特定 ETF 資訊
- `GET /api/v1/etfs/{symbol}/prices` - 取得價格歷史

### 回測功能
- `POST /api/v1/backtest/run` - 執行回測
- `POST /api/v1/backtest/monte-carlo` - 蒙地卡羅模擬
- `POST /api/v1/backtest/compare` - 多組合比較

### 分析工具
- `POST /api/v1/analysis/rolling-returns` - 滾動報酬分析
- `GET /api/v1/analysis/correlation-matrix` - 相關性矩陣
- `POST /api/v1/stress-test/run` - 壓力測試
- `GET /api/v1/stress-test/scenarios` - 取得危機情境

### 投資組合優化
- `POST /api/v1/optimizer/mpt` - MPT 優化
- `POST /api/v1/optimizer/efficient-frontier` - 效率前緣計算

### 回測儲存
- `GET /api/v1/saved-backtests` - 取得儲存的回測列表
- `POST /api/v1/saved-backtests` - 儲存回測結果

## 專案結構

```
etf-backtester/
├── backend/              # FastAPI 後端
│   ├── app/
│   │   ├── api/v1/endpoints/   # API 端點
│   │   ├── core/               # 回測引擎與分析工具
│   │   ├── db/                 # 資料庫與匯入腳本
│   │   ├── models/             # SQLAlchemy 模型
│   │   └── schemas/            # Pydantic 模型
│   └── requirements.txt
├── frontend/             # React 前端
│   ├── src/
│   │   ├── components/         # UI 組件
│   │   ├── pages/              # 頁面
│   │   ├── services/           # API 服務
│   │   ├── utils/              # 工具函數
│   │   └── types/              # TypeScript 類型
│   └── package.json
├── data/                 # 範例資料
├── docs/                 # 技術文件
└── README.md
```

## 開發計畫

### v1.0 已完成 ✅
- [x] 22 檔 ETF 數據
- [x] 歷史回測引擎
- [x] 蒙地卡羅模擬
- [x] 多組合比較
- [x] 投資組合優化（MPT）
- [x] 壓力測試（6 種危機情境）
- [x] 滾動報酬分析
- [x] 相關性矩陣
- [x] 通膨調整報酬
- [x] 報告匯出（PDF/CSV/Excel）
- [x] 投資組合存檔
- [x] 互動圖表（縮放/平移/下載）
- [x] 回撤分析

### v1.1 規劃中 🚀
- [ ] 更多 ETF（全球市場、債券類別）
- [ ] 戰術資產配置回測
- [ ] 稅務影響分析
- [ ] 使用者認證系統

## 📊 與 Portfolio Visualizer 對標

| 功能 | Portfolio Visualizer | 我們目前 |
|------|---------------------|---------|
| 投資組合回測 | ✅ | ✅ |
| Monte Carlo | ✅ | ✅ |
| 多組合比較 | ✅ | ✅ |
| 滾動報酬分析 | ✅ | ✅ |
| 相關性矩陣 | ✅ | ✅ |
| 壓力測試 | ✅ | ✅ |
| 投資組合優化器 | ✅ | ✅ |
| 通膨調整 | ✅ | ✅ |
| 報告匯出 | ✅ | ✅ |

## 部署上線

### 快速部署

專案已配置好部署檔案：

#### 後端部署 (Railway)
```bash
cd backend
railway login
railway init
railway up
```

#### 前端部署 (Vercel)
```bash
cd frontend
vercel login
vercel
```

詳細部署指南參見 [DEPLOY.md](DEPLOY.md)

## 相關文件

| 文件 | 說明 |
|------|------|
| [CHANGELOG.md](./CHANGELOG.md) | 版本更新日誌 |
| [ROADMAP-v1.1.md](./ROADMAP-v1.1.md) | v1.1 開發計畫 |
| [HANDOFF.md](./HANDOFF.md) | 開發交接記錄 |
| [AGENTS.md](./AGENTS.md) | 開發指南 |
| [DEPLOY.md](./DEPLOY.md) | 部署指南 |

## 貢獻指南

歡迎提交 Issue 和 Pull Request！

- 🐛 [回報 Bug](https://github.com/oscar120601/etf-backtester/issues)
- 💡 [提出建議](https://github.com/oscar120601/etf-backtester/issues)
- 🔧 [提交 PR](https://github.com/oscar120601/etf-backtester/pulls)

## 授權

MIT License

## 免責聲明

本工具僅供教育與研究用途，不構成投資建議。投資有風險，過去績效不代表未來表現。
