# ETF Backtester

一個功能完整的 ETF 投資組合回測工具，使用 FastAPI + React + TypeScript 開發。

## 功能特色

- 📊 **歷史回測**：根據歷史數據回測投資組合表現
- 🎲 **蒙地卡羅模擬**：預測未來可能的投資組合走勢
- 📈 **績效指標**：計算 CAGR、夏普比率、最大回撤等多種指標
- 🔄 **再平衡策略**：支援多種再平衡頻率設定
- 💰 **定期定額**：支援每月定期投入的回測
- 📉 **風險分析**：計算 VaR、CVaR 等風險指標
- 📱 **響應式設計**：支援桌面與行動裝置

## 技術架構

### 後端
- **FastAPI**：現代、快速的 Python Web 框架
- **SQLAlchemy**：ORM 資料庫操作
- **SQLite**：開發環境使用（可升級至 PostgreSQL）
- **Pandas/NumPy**：數據處理與計算

### 前端
- **React 18**：使用者介面框架
- **TypeScript**：型別安全的 JavaScript
- **Material-UI (MUI)**：現代化 UI 組件庫
- **Chart.js**：圖表繪製
- **Axios**：HTTP 客戶端

## 快速開始

### 系統需求
- Python 3.10+
- Node.js 18+

### 安裝步驟

#### 1. 複製專案

```bash
git clone https://github.com/oscar120601/etf-backtester.git
cd etf-backtester
```

#### 2. 設定後端

```bash
# 建立虛擬環境
cd backend
python -m venv venv

# 啟動虛擬環境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安裝依賴
pip install -r requirements.txt

# 初始化資料庫
python -c "from app.db.init_db import init_db; init_db()"

# 匯入範例價格資料
python -m app.db.import_prices --csv ../data/etf_prices_sample.csv

# 或產生模擬資料
python -m app.db.import_prices --generate --symbol VTI --start-date 2020-01-01 --end-date 2025-03-10

# 啟動開發伺服器
uvicorn app.main:app --reload --port 8000
```

#### 3. 設定前端

```bash
# 在另一個終端視窗
cd frontend

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

#### 4. 開啟瀏覽器

- 前端: http://localhost:5173
- API 文件: http://localhost:8000/docs

### Windows 一鍵啟動 (推薦)

最簡單的啟動方式，自動開啟前後端：

```bash
# 方法一：批次檔（最簡單）
start-dev.bat

# 方法二：PowerShell 進階版（彩色輸出、自動開瀏覽器）
start-dev.ps1
# 或
powershell -ExecutionPolicy Bypass -File start-dev.ps1
```

執行後會自動：
1. 檢查 Python 和 Node.js 環境
2. 建立/啟動 Python 虛擬環境
3. 安裝缺少的相依套件
4. 啟動後端 (http://localhost:8000)
5. 啟動前端 (http://localhost:5173)
6. 自動開啟瀏覽器 (PowerShell 版)

按任意鍵即可關閉所有服務。

## 使用說明

### 1. ETF 列表

- 點擊左側選單「ETF 列表」
- 瀏覽系統支援的 ETF 資訊
- 使用搜尋框快速找到特定 ETF

### 2. 投資組合回測

- 點擊左側選單「投資組合回測」
- 配置投資組合：
  - 選擇 ETF（最多 10 檔）
  - 設定權重（總和需為 100%）
- 設定回測參數：
  - 開始/結束日期
  - 初始投資金額
  - 再平衡頻率
  - 每月定期投入（選填）
- 點擊「執行回測」查看結果

### 3. 解讀回測結果

- **績效摘要**：總報酬率、年化報酬率、最大回撤、夏普比率
- **價值走勢圖**：投資組合與基準的比較
- **詳細指標**：波動率、索丁諾比率、卡瑪比率等
- **年度統計**：最佳/最差年度表現、正報酬年數

### 4. 蒙地卡羅模擬

- 點擊左側選單「蒙地卡羅模擬」
- 選擇 ETF 並設定參數：
  - 初始金額與定期定額
  - 模擬年數（10-50 年）
  - 模擬次數（100-5000 次）
  - 目標金額
- 點擊「執行模擬」查看結果

### 5. 解讀蒙地卡羅結果

- **達成目標機率**：達成設定目標的機率
- **百分位數路徑**：不同情境下的預測走勢
- **關鍵年份預測**：第 5/10/20 年的預測價值

## 資料匯入

### 從 CSV 匯入

```bash
# 匯入 CSV 檔案
cd backend
python -m app.db.import_prices --csv ../data/etf_prices_sample.csv
```

CSV 格式：`symbol,date,open,high,low,close,adjusted_close,volume,dividend`

### 產生模擬資料

```bash
# 產生指定 ETF 的模擬資料
python -m app.db.import_prices --generate --symbol VTI --start-date 2020-01-01 --end-date 2025-03-10
```

## API 端點

### ETF 管理
- `GET /api/v1/etfs/` - 取得所有 ETF
- `GET /api/v1/etfs/{symbol}` - 取得特定 ETF 資訊
- `GET /api/v1/etfs/{symbol}/prices` - 取得價格歷史

### 回測功能
- `POST /api/v1/backtest/run` - 執行回測
- `POST /api/v1/backtest/monte-carlo` - 蒙地卡羅模擬
- `GET /api/v1/backtest/supported-etfs` - 取得支援的 ETF 列表

## 開發計畫

- [x] 專案架構設計
- [x] 資料庫模型設計
- [x] 後端 API 開發
- [x] 回測引擎實作
- [x] 績效指標計算
- [x] 前端介面開發
- [x] 資料匯入功能
- [x] 蒙地卡羅模擬
- [x] 前端優化（Loading、錯誤處理）
- [ ] 使用者認證
- [ ] 回測結果儲存
- [ ] 報告匯出功能
- [ ] 更多圖表類型

## 專案結構

```
etf-backtester/
├── backend/              # FastAPI 後端
│   ├── app/
│   │   ├── api/v1/endpoints/   # API 端點
│   │   ├── core/               # 回測引擎與指標計算
│   │   ├── db/                 # 資料庫與匯入腳本
│   │   ├── models/             # SQLAlchemy 模型
│   │   └── schemas/            # Pydantic 模型
│   └── requirements.txt
├── frontend/             # React 前端
│   ├── src/
│   │   ├── components/         # UI 組件
│   │   ├── pages/              # 頁面
│   │   ├── services/           # API 服務
│   │   └── types/              # TypeScript 類型
│   └── package.json
├── data/                 # 範例資料
│   └── etf_prices_sample.csv
├── docs/                 # 技術文件
└── README.md
```

## 貢獻指南

歡迎提交 Issue 和 Pull Request！

## 授權

MIT License

## 免責聲明

本工具僅供教育與研究用途，不構成投資建議。投資有風險，過去績效不代表未來表現。
