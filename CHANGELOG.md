# 更新日誌

所有版本的變更記錄。

## [v1.0.0] - 2026-03-13

### 主要功能

#### 回測引擎
- 歷史回測：自訂日期區間、再平衡策略、定期定額
- Monte Carlo 模擬：10-50 年預測、100-5000 次模擬
- 多組合比較：最多 3 組並排比較

#### 投資組合工具
- MPT 投資組合優化：效率前緣、最大夏普比率、最小波動率
- 預設模板：60/40、全天候、科技股等 6 種一鍵套用
- 投資組合存檔：localStorage 儲存多個配置

#### 風險分析
- 壓力測試：6 種歷史危機情境（2008 金融危機、2020 疫情等）
- 回撤分析：最大回撤、持續時間、恢復統計
- 滾動報酬：1/3/5/10 年期間分析
- 相關性矩陣：ETF 間相關性熱力圖
- 通膨調整：實質報酬計算

#### 報告與匯出
- PDF 報告：完整分析報告書
- CSV 匯出：時間序列數據
- Excel 匯出：多工作表詳細分析

#### 互動功能
- 圖表縮放/平移（chartjs-plugin-zoom）
- 圖表下載 PNG
- 響應式設計（手機/平板/桌面）

### 資料

- **ETF 總數**: 22 檔
  - Phase 1（14 檔）：VTI, VOO, VUAA, QQQ, AVUV, QMOM, SCHD, CNDX, EQQQ, AVWS, IUMO, VT, VXUS, BND
  - Phase 2（8 檔）：VTV, VUG, VBR, VBK, VIG, VYM, DGRO, HDV
- **價格數據**: 2020-01 至 2026-03，每檔約 1,550+ 筆日線資料

### 技術實現

#### 後端
- FastAPI + Python 3.10+
- SQLAlchemy + SQLite
- Pandas/NumPy/SciPy 計算

#### 前端
- React 18 + TypeScript（嚴格模式）
- Material-UI v7
- Chart.js + chartjs-plugin-zoom

### 修復

- 修復 46 個 TypeScript 編譯錯誤
- 統一 ETF 類型定義
- 修復 Chart.js 類型相容性

### 部署

- GitHub 倉庫：https://github.com/oscar120601/etf-backtester
- 支援 Railway + Vercel 部署

---

## [v0.5.0] - 2026-03-12

### 新增
- Phase 1 ETF 擴充（14 檔）
- 多組合比較功能
- 存檔功能（後端）
- 預設模板

### 修復
- 修復 VTI/VOO/QQQ/BND/VT 價格數據異常
- Monte Carlo 模擬驗證通過

---

## [v0.4.0] - 2026-03-11

### 新增
- 基礎回測引擎
- Monte Carlo 模擬
- 基礎 ETF 列表（5 檔）
- 前端基礎架構

---

**格式基於**: [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)
