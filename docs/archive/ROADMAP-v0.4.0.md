# ETF 回測工具改版計畫 v0.4.0

## 📋 現況檢視

### 當前狀態 (v0.3.0)
| 項目 | 現況 | 目標 | 狀態 |
|------|------|------|------|
| ETF 數量 | 5 檔 | 13+ 檔 | ⚠️ 需擴充 |
| 美股 ETF | VTI, VOO, QQQ | 7 檔 | ⚠️ 缺少 4 檔 |
| 英股 ETF | 無 | 4 檔 | 🔴 完全缺少 |
| 債券 ETF | BND | 1 檔 | ✅ 完成 |
| 國際 ETF | VT | 1 檔 | ✅ 完成 |
| 回測功能 | 基礎回測 | 回測 + Monte Carlo | ✅ 完成 |
| 多組合比較 | 無 | 3 組比較 | ⚠️ 待開發 |
| 報告匯出 | 無 | PDF/CSV | ⚠️ 待開發 |
| 預設模板 | 無 | 60/40、全天候等 | ⚠️ 待開發 |
| 啟動方式 | 手動分開 | 一鍵啟動 | ⚠️ 待優化 |

---

## 1️⃣ 問題一：ETF 擴充計畫（Phase 1 完整版）

### 1.1 缺少的 ETF 清單

**美股 ETF（需新增 4 檔）**
| 代碼 | 名稱 | 類別 | 用途 |
|------|------|------|------|
| VUAA | Vanguard S&P 500 UCITS ETF (USD) Accumulating | 美股大盤累積型 | 歐洲投資者適用 |
| AVUV | Avantis U.S. Small Cap Value ETF | 小型價值股 | 因子投資 |
| QMOM | Alpha Architect U.S. Quantitative Momentum ETF | 動能股 | 動能策略 |
| SCHD | Schwab US Dividend Equity ETF | 高股息 | 收益型投資 |

**英股 ETF（需新增 4 檔）**
| 代碼 | 名稱 | 類別 | 用途 |
|------|------|------|------|
| CNDX | iShares NASDAQ 100 UCITS ETF | 納斯達克100（英鎊） | 英國投資者 |
| EQQQ | Invesco EQQQ NASDAQ-100 UCITS ETF | 納斯達克100（歐元） | 歐洲投資者 |
| AVWS | Avantis International Small Cap Value ETF | 國際小型價值 | 全球因子 |
| IUMO | iShares MSCI USA Momentum Factor UCITS ETF | 美國動能因子 | 動能因子 |

**國際 ETF（需新增 1 檔）**
| 代碼 | 名稱 | 類別 | 用途 |
|------|------|------|------|
| VXUS | Vanguard Total International Stock ETF | 全球不含美國 | 國際分散 |

### 1.2 ETF 擴充實作計畫

```
Week 1: 美股 ETF 擴充
├── Day 1-2: VUAA, AVUV 資料匯入
├── Day 3-4: QMOM, SCHD 資料匯入
└── Day 5: 資料驗證與測試

Week 2: 英股 ETF 擴充
├── Day 1-2: CNDX, EQQQ 資料匯入
├── Day 3-4: AVWS, IUMO 資料匯入
└── Day 5: 資料驗證與測試

Week 3: 國際 ETF 與整合
├── Day 1-2: VXUS 資料匯入
├── Day 3-4: ETF 分類標籤更新
└── Day 5: 完整測試
```

---

## 2️⃣ 問題二：新功能開發計畫

### 2.1 P1 優先功能（核心體驗）

#### A. 多組合比較功能
```
功能描述：
- 支援最多 3 組投資組合同時比較
- 並排顯示各組合的績效指標
- 疊加顯示累積報酬曲線（不同顏色）
- 比較表格：CAGR、波動率、夏普比率、最大回撤

技術實作：
- 前端：新增 Comparison.tsx 頁面
- 後端：擴充 backtest API 支援多組合同時計算
- 圖表：Chart.js 多線圖疊加
```

#### B. 報告匯出功能
```
功能描述：
- PDF 報告：完整回測結果報告書
- CSV 匯出：原始數據下載
- Excel 匯出：含圖表的試算表

技術實作：
- PDF：使用 jsPDF + html2canvas
- CSV：前端直接產生並下載
- Excel：使用 SheetJS (xlsx)
```

#### C. 預設配置模板
```
模板清單：
1. 經典 60/40：VOO 60% + BND 40%
2. 全天候組合：VTI 30% + VXUS 20% + BND 40% + VNQ 10%
3. 科技股集中：QQQ 70% + VTI 30%
4. 全球分散：VT 100%
5. 股息收益：SCHD 50% + VYM 50%
6. 小型價值：AVUV 40% + VBR 40% + BND 20%

技術實作：
- 新增 templates.json 設定檔
- 前端：模板選擇下拉選單
- 點擊後自動填入 ETF 與權重
```

### 2.2 P2 進階功能（體驗提升）

#### D. 更多圖表類型
```
新增圖表：
1. 回撤分析圖 (Drawdown Chart)
   - 顯示歷史回撤幅度與持續時間
   
2. 年度報酬熱力圖 (Annual Returns Heatmap)
   - 矩陣顯示每年各資產報酬
   
3. 滾動報酬分布圖 (Rolling Returns)
   - 1年/3年/5年滾動報酬箱型圖
   
4. 資產配置圓餅圖 (Asset Allocation)
   - 互動式資產類別分布
   
5. 相關性矩陣熱力圖 (Correlation Matrix)
   - ETF 間價格相關性分析
```

#### E. 壓力測試功能
```
功能描述：
- 模擬特定市場危機情境下的表現
- 預設情境：2008金融危機、2020疫情、2022通膨
- 自訂情境：指定日期區間模擬

技術實作：
- 後端：新增 stress_test 端點
- 使用歷史真實危機期間數據
- 前端：情境選擇介面
```

#### F. 存檔/載入功能
```
功能描述：
- 儲存投資組合設定到 localStorage
- 可載入先前儲存的組合
- 命名與管理多個組合

技術實作：
- 前端：使用 localStorage API
- 新增 SavedPortfolios.tsx 頁面
```

---

## 3️⃣ 問題三：原先計畫回顧

### 3.1 PRD 中的功能規劃

| 功能模組 | 原定規劃 | 現況 | 優先級 |
|---------|---------|------|--------|
| **ETF 擴充** | Phase 1: 13 檔 | 5 檔 | P0 |
| **多組合比較** | 支援 3 組比較 | 未實作 | P1 |
| **預設模板** | 常見配置模板 | 未實作 | P1 |
| **報告匯出** | PDF/CSV/Excel | 未實作 | P1 |
| **存檔功能** | 儲存/載入組合 | 未實作 | P1 |
| **更多圖表** | 回撤、熱力圖等 | 未實作 | P2 |
| **Monte Carlo** | 蒙地卡羅模擬 | ✅ 已實作 | P2 |
| **壓力測試** | 危機情境模擬 | 未實作 | P2 |
| **通膨調整** | 實質報酬計算 | 未實作 | P2 |
| **基準比較** | 相對基準分析 | 基礎版 | P2 |
| **稅務分析** | 稅務影響估算 | 未實作 | P3 |
| **管理後台** | ETF 管理介面 | 未實作 | P3 |

### 3.2 長期擴充路線圖

```
Phase 2 (v1.2): +8 檔 ETF（因子投資）
├── 價值/成長因子：VTV, VUG, VBR, VBK
└── 股息策略：VIG, VYM, DGRO, HDV

Phase 3 (v1.5): +7 檔 ETF（全球配置）
├── 區域市場：VEA, VWO, VGK, VPL, EWJ, EWC, IEFA

Phase 4 (v2.0): +12 檔 ETF（資產類別完整化）
├── 債券完整配置：VGIT, VGSH, VGLT, VCIT, VCSH, BNDX, VMBS, VTEB, SHV, TIP
└── 替代性資產：VNQ, GLD, IAU, PFF
```

---

## 4️⃣ 問題四：啟動方式優化

### 4.1 目標：一鍵啟動前後端

#### 方案 A：整合啟動腳本（推薦）

**Windows: start-dev.bat**
```batch
@echo off
:: 啟動 ETF 回測工具開發環境

echo ==========================================
echo   ETF Backtester - Development Mode
echo ==========================================

:: 檢查 Python
echo [1/4] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found!
    exit /b 1
)

:: 啟動後端
echo [2/4] Starting Backend...
start "Backend" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"
timeout /t 3 >nul

:: 啟動前端
echo [3/4] Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 >nul

echo [4/4] Done!
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to stop all services...
pause >nul

:: 關閉所有相關進程
taskkill /FI "WindowTitle eq Backend*" /F >nul 2>&1
taskkill /FI "WindowTitle eq Frontend*" /F >nul 2>&1
echo Services stopped.
```

**PowerShell: start-dev.ps1（進階版）**
```powershell
# 彩色輸出、自動檢查端口、健康檢查
# 顯示服務狀態儀表板
# 一鍵關閉所有服務
```

#### 方案 B：Docker Compose（長期）

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
```

### 4.2 實作計畫

| 任務 | 時間 | 說明 |
|------|------|------|
| Windows batch 腳本 | 2 小時 | 最優先，立即改善體驗 |
| PowerShell 腳本 | 4 小時 | 進階功能，彩色輸出 |
| README 更新 | 1 小時 | 更新啟動說明 |

---

## 5️⃣ 改版計畫總時程

### 5.1 v0.4.0 開發時程（4 週）

```
Week 1: ETF 擴充 + 啟動優化
├─ Day 1-2: 新增 VUAA, AVUV, QMOM, SCHD
├─ Day 3-4: 新增 CNDX, EQQQ, AVWS, IUMO
├─ Day 5: 新增 VXUS，ETF 資料驗證
└─ Weekend: 製作一鍵啟動腳本

Week 2: 核心功能開發
├─ Day 1-2: 多組合比較功能
├─ Day 3-4: 預設配置模板
└─ Day 5: 存檔/載入功能

Week 3: 報告與圖表
├─ Day 1-2: PDF/CSV/Excel 匯出
├─ Day 3-4: 回撤分析圖 + 年度熱力圖
└─ Day 5: 相關性矩陣 + 滾動報酬

Week 4: 壓力測試與整合
├─ Day 1-2: 壓力測試功能
├─ Day 3-4: 整合測試與 Bug 修復
└─ Day 5: 文件更新與發布
```

### 5.2 優先級矩陣

| 功能 | 影響力 | 實作難度 | 優先級 |
|------|--------|---------|--------|
| ETF 擴充到 13 檔 | 高 | 低 | 🔥 P0 |
| 一鍵啟動腳本 | 高 | 低 | 🔥 P0 |
| 多組合比較 | 高 | 中 | 🎯 P1 |
| 預設模板 | 高 | 低 | 🎯 P1 |
| 報告匯出 | 中 | 中 | 🎯 P1 |
| 存檔功能 | 中 | 低 | 🎯 P1 |
| 更多圖表 | 中 | 中 | 📌 P2 |
| 壓力測試 | 低 | 高 | 📌 P2 |

---

## 6️⃣ 檢查清單

### v0.4.0 完成標準

- [ ] ETF 總數達到 13 檔（美股 7 + 英股 4 + 國際 1 + 債券 1）
- [ ] 一鍵啟動腳本可用（Windows batch）
- [ ] 多組合比較功能可用
- [ ] 至少 3 個預設模板可用
- [ ] 報告可匯出 PDF 與 CSV
- [ ] 投資組合可存檔與載入
- [ ] 新增回撤分析圖表
- [ ] README 與文件已更新

---

**制定日期**: 2026-03-12  
**目標版本**: v0.4.0  
**預計完成**: 4 週後 (2026-04-09)
