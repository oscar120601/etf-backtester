# ETF 投資組合回測工具

一個專業的 ETF 投資組合回測工具，支援美股與英股 ETF 的歷史績效分析。

## 🚀 快速開始

### 系統需求

- Docker Desktop
- Python 3.11+ (可選，用於本地開發)
- Node.js 20+ (可選，用於前端開發)

### 啟動開發環境

1. **使用 PowerShell 腳本（推薦）**:
```powershell
.\start-dev.ps1
```

2. **或使用 Docker Compose**:
```bash
# 啟動所有服務
docker-compose up -d

# 檢視日誌
docker-compose logs -f

# 停止服務
docker-compose down
```

### 開發環境網址

| 服務 | 網址 |
|------|------|
| 前端 | http://localhost:3000 |
| 後端 API | http://localhost:8000 |
| API 文件 | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 |

---

## 📁 專案結構

```
etf-backtester/
├── backend/                 # FastAPI 後端
│   ├── app/
│   │   ├── api/            # API 路由
│   │   ├── core/           # 核心計算邏輯
│   │   ├── db/             # 資料庫設定
│   │   ├── models/         # SQLAlchemy 模型
│   │   ├── schemas/        # Pydantic 模型
│   │   └── services/       # 業務邏輯
│   ├── alembic/            # 資料庫遷移
│   └── tests/              # 測試
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/     # React 元件
│   │   ├── pages/          # 頁面
│   │   ├── services/       # API 服務
│   │   └── types/          # TypeScript 型別
│   └── package.json
├── database/               # 資料庫腳本
│   └── init/               # 初始化腳本
├── docs/                   # 文件
│   ├── 01-System-Architecture.md
│   ├── 02-API-Specification.md
│   ├── 03-Database-Design.md
│   └── 04-Development-Plan.md
├── docker-compose.yml      # Docker 設定
└── README.md
```

---

## 🛠️ 技術棧

### 後端
- **框架**: FastAPI
- **資料庫**: PostgreSQL 16
- **快取**: Redis 7
- **ORM**: SQLAlchemy 2.0
- **任務佇列**: Celery
- **計算**: Pandas, NumPy

### 前端
- **框架**: React 18
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **圖表**: Chart.js
- **建置**: Vite

---

## 📚 文件

- [產品需求書 (PRD)](PRD-ETF-Backtest-Tool.md)
- [系統架構文件](docs/01-System-Architecture.md)
- [API 設計文件](docs/02-API-Specification.md)
- [資料庫設計文件](docs/03-Database-Design.md)
- [開發計畫書](docs/04-Development-Plan.md)

---

## 📝 開發指令

### 後端開發

```bash
cd backend

# 建立虛擬環境
python -m venv venv
.\venv\Scripts\activate

# 安裝依賴
pip install -r requirements.txt

# 執行 Migration
alembic upgrade head

# 啟動開發伺服器
uvicorn app.main:app --reload

# 執行測試
pytest
```

### 前端開發

```bash
cd frontend

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置生產版本
npm run build
```

---

## 🐳 Docker 指令

```bash
# 建置所有映像檔
docker-compose build

# 啟動所有服務
docker-compose up -d

# 檢視特定服務日誌
docker-compose logs -f backend
docker-compose logs -f frontend

# 進入容器
docker exec -it etf-backend bash
docker exec -it etf-db psql -U etf_user -d etf_backtest

# 重新啟動特定服務
docker-compose restart backend

# 清理所有資料（警告：會刪除資料庫）
docker-compose down -v
```

---

## 🎯 初始 ETF 清單

### 美股 ETF (7檔)
- VTI - Vanguard 全市場股票 ETF
- VOO - Vanguard S&P 500 ETF
- VUAA - Vanguard S&P 500 UCITS ETF (美元累積型)
- QQQ - Invesco 納斯達克 100 ETF
- AVUV - Avantis 美國小型價值股 ETF
- QMOM - Alpha Architect 美國量化動能 ETF
- SCHD - Schwab 美國股息股票 ETF

### 英股/歐股 ETF (4檔)
- CNDX - iShares 納斯達克 100 UCITS ETF
- EQQQ - Invesco EQQQ 納斯達克 100 UCITS ETF
- AVWS - Avantis 國際小型價值股 ETF
- IUMO - iShares MSCI 美國動能因子 UCITS ETF

### 國際股票 ETF (1檔)
- VXUS - Vanguard 國際股票 ETF

### 債券 ETF (1檔)
- BND - Vanguard 總體債券市場 ETF

---

## 📄 授權

MIT License
