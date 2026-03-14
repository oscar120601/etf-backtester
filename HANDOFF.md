# 開發交接文件

## 📅 會話記錄

### 2026-03-14 開發會話（PortfolioSelector 統一組件 + 存檔功能修復）

#### 已完成工作

- [x] **統一投資組合選擇器**
  - 建立 `PortfolioSelector` 組件，統一所有頁面的投資組合輸入
  - 支援手動 ETF 選擇與權重配置（滑塊 + 數字輸入）
  - 支援從已儲存組合載入
  - 實時權重驗證與視覺反饋
  - 一鍵均分權重功能

- [x] **頁面更新使用統一組件**
  - 蒙地卡羅模擬：更新為使用 PortfolioSelector，支援多 ETF
  - 壓力測試：更新為使用 PortfolioSelector
  - 投資分析：滾動報酬分析使用 PortfolioSelector
  - 投資組合優化：可從已儲存組合載入 ETF 列表

- [x] **存檔功能修復**
  - 發現問題：localStorage 與後端數據庫兩套獨立存儲機制
  - 修復：統一使用後端數據庫作為唯一數據源
  - 更新 `SavedPortfoliosManager` 使用 `savedBacktestAPI`
  - 更新後端 API 列表返回 portfolio 欄位

- [x] **其他 Bug 修復**
  - 修復模板使用不存在 ETF（VOO→VUAA, BND→VXUS）
  - 修復 RebalanceFrequency 枚舉相容性
  - 修復 numpy 類型序列化問題
  - 修復優化器參數傳遞錯誤

#### 新增/修改檔案

```
frontend/src/
├── components/
│   ├── PortfolioSelector.tsx           (新增)
│   └── SavedPortfoliosManager.tsx      (重構：改為使用 API)
├── pages/
│   ├── MonteCarlo.tsx                  (更新：使用 PortfolioSelector)
│   ├── StressTest.tsx                  (更新：使用 PortfolioSelector)
│   ├── Analysis.tsx                    (更新：使用 PortfolioSelector)
│   └── Optimizer.tsx                   (更新：支援載入已儲存組合)

backend/
├── app/schemas/saved_backtest.py       (更新：新增 portfolio 欄位)
└── app/api/v1/endpoints/saved_backtests.py  (更新：解析 portfolio_config)
```

#### 技術債說明

**已解決**：
- 統一存儲機制，消除 localStorage 與數據庫不一致問題
- 統一投資組合輸入組件，提升用戶體驗一致性

**注意事項**：
- 舊的 localStorage 數據需要手動清理
- 所有投資組合現儲存於後端數據庫

---

### 2026-03-13 開發會話（TypeScript 修復 + GitHub 發布）

#### 已完成工作

- [x] **TypeScript 類型修復**
  - 修復 46 個 TypeScript 編譯錯誤
  - 統一 ETF 類型定義（從 `types/etf.ts` 導出）
  - 添加缺失的 `BacktestParameters.benchmark` 屬性
  - 添加缺失的 `time_series.annual_returns` 屬性
  - 修復 Chart.js scales callback 類型不匹配
  - 修復 LoadingOverlayProps 缺少 'open' 屬性
  - 修復 portfolioStorage.ts convertToTemplate 返回值
  - 移除所有未使用的導入和變數

- [x] **GitHub 發布 v1.0**
  - 創建 GitHub 倉庫: https://github.com/oscar120601/etf-backtester
  - 推送完整代碼（41 個文件，8,293 行新增）
  - 驗證構建成功

#### 修復詳情

| 錯誤類型 | 數量 | 說明 |
|---------|------|------|
| TS6133 | 15+ | 未使用的變數/導入 |
| TS2339 | 10+ | 缺少屬性定義 |
| TS2322 | 8+ | Chart.js 類型不匹配 |
| TS6192 | 5+ | 未使用的導入聲明 |
| 其他 | 8+ | 類型相容性問題 |

---

### 2026-03-13 開發會話（Week 3 完成 - Phase 2 ETF 擴充 + 進階功能）

#### 已完成工作

- [x] **Phase 2 ETF 擴充（8 檔因子 ETF）**
  - 新增價值/成長因子：VTV, VUG, VBR, VBK
  - 新增股息策略：VIG, VYM, DGRO, HDV
  - 總計：22 檔 ETF
  - 建立 `import_phase2_etfs.py` 腳本

- [x] **A: 報告匯出功能增強**
  - 新增 Excel 匯出（多工作表）
  - 支援 CSV、PDF、Excel 三種格式
  - 報告內容：配置、參數、績效、時間序列、年度報酬

- [x] **B: Chart.js 互動增強**
  - 安裝 chartjs-plugin-zoom 套件
  - 支援滾輪縮放、Ctrl+拖曳平移
  - 支援框選縮放
  - 新增圖表下載功能（PNG）
  - 新增重置縮放按鈕

- [x] **C: 投資組合存檔功能**
  - 建立 `portfolioStorage.ts` 工具
  - 建立 `SavedPortfoliosManager` 組件
  - 支援儲存、載入、編輯、刪除組合
  - 支援 JSON 匯出/匯入
  - 使用 localStorage 儲存

- [x] **D: 回撤分析圖表**
  - 建立 `DrawdownAnalysis` 組件
  - 顯示最大回撤與發生日期
  - 顯示最長回撤期間
  - 顯示平均回撤與頻率
  - 恢復時間統計
  - 歷史回撤區間表格

- [x] **文件更新**
  - 重新整理 README.md
  - 更新 QUICK_SUMMARY.md
  - 建立 ROADMAP-v1.1.md
  - 更新 AGENTS.md

#### 新增檔案
```
frontend/src/
├── components/
│   ├── SavedPortfoliosManager.tsx
│   └── DrawdownAnalysis.tsx
└── utils/
    ├── chartConfig.ts
    └── portfolioStorage.ts

backend/
├── app/db/import_phase2_etfs.py
└── import_phase2_prices.py
```

---

### 2026-03-12 開發會話（第八部分：Week 3 完成 - 圖表 + 匯出 + 資料同步）

#### 已完成工作
- [x] **Week 3 Day 1-2: 圖表增強**
  - 新增 `BacktestCharts` 組件，包含：
    - 回撤分析圖（紅色區域圖顯示歷史回撤）
    - 年度報酬率柱狀圖（綠/紅色區分正負收益）
    - 月度收益熱力圖（顏色深淺表示收益強度）

- [x] **Week 3 Day 2-3: 報告匯出功能**
  - 新增 `ExportReport` 組件
  - CSV 匯出：時間序列數據 + 績效指標
  - PDF 匯出：含圖表截圖的完整報告
  - 安裝 jspdf 和 html2canvas 套件

- [x] **Week 3 Day 4: 資料同步機制**
  - 新增 `/data-sync` API 端點
  - 從 Yahoo Finance 自動抓取最新價格
  - 新增 `DataSyncPanel` 管理界面
  - 顯示各 ETF 資料更新狀態

- [x] **Week 3 Day 5: 響應式設計優化**
  - 手機版頂部/底部留白處理
  - 表格橫向捲動支援
  - 小螢幕隱藏次要欄位
  - 新增響應式佈局組件

---

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
