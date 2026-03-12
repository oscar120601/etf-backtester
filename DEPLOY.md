# ETF Backtester 部署指南

## 概述

本專案使用以下架構部署：
- **後端**: Railway (FastAPI + SQLite)
- **前端**: Vercel (React + Vite)

## 部署步驟

### 1. 後端部署到 Railway

#### 1.1 準備工作

確保以下檔案已提交到 Git：
- `backend/Procfile`
- `backend/railway.toml`
- `backend/runtime.txt`
- `backend/requirements.txt`

#### 1.2 建立 Railway 專案

```bash
# 安裝 Railway CLI
npm install -g @railway/cli

# 登入
railway login

# 初始化專案
cd backend
railway init

# 設定專案名稱: etf-backtester-api
```

#### 1.3 設定環境變數

在 Railway Dashboard 中設定以下變數：

```
APP_NAME=ETF Backtester API
APP_VERSION=1.0.0
ENVIRONMENT=production
DEBUG=false
DATABASE_URL=sqlite:///./etf_backtest.db
API_V1_STR=/api/v1
SECRET_KEY=your-secure-secret-key-here
BACKEND_CORS_ORIGINS=["*"]
```

#### 1.4 部署

```bash
railway up
```

部署後會獲得類似 `https://etf-backtester-api.up.railway.app` 的 URL。

### 2. 前端部署到 Vercel

#### 2.1 準備工作

確保 `vercel.json` 已提交到 Git。

#### 2.2 設定環境變數

更新 `vercel.json` 中的 `VITE_API_URL` 為 Railway 部署的 URL：

```json
{
  "env": {
    "VITE_API_URL": "https://your-railway-url.railway.app/api/v1"
  }
}
```

#### 2.3 部署

**方式一：透過 Vercel CLI**

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入
vercel login

# 部署前端
cd frontend
vercel

# 設定專案名稱: etf-backtester
# 自動偵測框架: Vite
```

**方式二：透過 GitHub 整合**

1. 將程式碼推送到 GitHub
2. 登入 Vercel Dashboard
3. 點擊 "Add New Project"
4. 選擇 GitHub Repository
5. 設定：
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: dist
6. 添加環境變數 `VITE_API_URL`
7. 點擊 Deploy

### 3. 驗證部署

#### 3.1 測試後端 API

```bash
curl https://your-railway-url.railway.app/health
```

應回傳：
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

#### 3.2 測試前端

開啟 Vercel 部署的 URL，確認：
- ETF 列表正常載入
- 回測功能正常運作
- 圖表正常顯示

### 4. 設定自定義域名（可選）

#### 4.1 後端自定義域名

1. 在 Railway Dashboard 中購買或添加自定義域名
2. 更新前端的 `VITE_API_URL` 環境變數
3. 重新部署前端

#### 4.2 前端自定義域名

1. 在 Vercel Dashboard 中添加自定義域名
2. 按照指示設定 DNS 記錄
3. 等待 SSL 證書自動生成

## 自動部署

### Railway 自動部署

每次推送到 `main` 分支會自動觸發部署。

### Vercel 自動部署

每次推送到 `main` 分支會自動觸發部署。

## 監控與日誌

### Railway

```bash
# 查看日誌
railway logs

# 持續監控
railway logs --follow
```

### Vercel

在 Vercel Dashboard 中查看部署狀態和函數日誌。

## 故障排除

### 後端問題

**問題**: 健康檢查失敗
**解決**: 確認 ` Procfile` 和 `railway.toml` 配置正確

**問題**: 資料庫連接失敗
**解決**: 確認 `DATABASE_URL` 環境變數設定正確

**問題**: CORS 錯誤
**解決**: 確認 `BACKEND_CORS_ORIGINS` 包含前端域名

### 前端問題

**問題**: API 請求失敗
**解決**: 確認 `VITE_API_URL` 環境變數設定正確

**問題**: 構建失敗
**解決**: 確認 `vercel.json` 配置正確

## 回滾部署

### Railway

在 Railway Dashboard 中選擇之前的部署版本，點擊 "Redeploy"。

### Vercel

在 Vercel Dashboard 的 Deployments 頁面，選擇之前的版本點擊 "Promote to Production"。

## 安全建議

1. **生產環境密鑰**: 使用強密碼作為 `SECRET_KEY`
2. **CORS 設定**: 生產環境建議限制為特定域名
3. **速率限制**: 已內建速率限制，可依需求調整
4. **資料備份**: 定期備份 SQLite 資料庫檔案

## 成本估算

### Railway (免費方案)
- 512 MB RAM
- 1 GB 磁碟空間
- 每月 $5 免費額度
- 適合：小型專案、開發測試

### Vercel (免費方案)
- 100 GB 頻寬
- 每月 6,000 分鐘構建時間
- 適合：靜態網站、小型應用

如需更高規格，可升級至付費方案。

## 聯絡支援

- Railway 文件: https://docs.railway.app/
- Vercel 文件: https://vercel.com/docs
- 專案 Issues: https://github.com/oscar120601/etf-backtester/issues
