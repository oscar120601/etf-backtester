# ETF 回測工具 - 開發指南

## 🎯 專案概述

這是一個 ETF 投資組合回測工具，支援美股與英股 ETF 的歷史績效分析。

**核心文件位置：**
- `PRD-ETF-Backtest-Tool.md` - 產品需求書
- `docs/01-System-Architecture.md` - 系統架構
- `docs/02-API-Specification.md` - API 設計
- `docs/03-Database-Design.md` - 資料庫設計
- `docs/04-Development-Plan.md` - 開發計畫

---

## 📋 開發原則

### 技術棧
- **前端**: React 18 + TypeScript + Tailwind CSS + Chart.js
- **後端**: Python FastAPI + SQLAlchemy + Pandas
- **資料庫**: PostgreSQL 16 + Redis
- **部署**: Docker + Docker Compose

### 程式碼規範
- 使用 TypeScript 嚴格模式
- API 遵循 RESTful 設計
- 資料庫使用 Migration 管理
- 所有計算邏輯需有單元測試

---

## 🔗 關鍵參考

### ETF 清單（初始 13 檔）
美股: VTI, VOO, VUAA, QQQ, AVUV, QMOM, SCHD
英股: CNDX, EQQQ, AVSV/AVWS, IUMO
國際: VXUS
債券: BND

### 核心功能優先級
- **P0**: 基本回測、權重調整、績效圖表
- **P1**: 多組合比較、基準對比、報告匯出
- **P2**: Monte Carlo、壓力測試

### 效能目標
- 回測計算 < 3 秒
- 支援 10 檔 ETF 組合
- 支援 20+ 年歷史資料

---

## 🛠️ 適用的 SKILLS

開發時會自動參考以下 Claude Code SKILLS：

### 前端開發
- `react-dev` - React TypeScript 型別與模式
- `frontend-dev-guidelines` - 現代前端最佳實踐
- `mui` / `tailwind-patterns` - UI 元件庫（如選用）

### 後端開發
- `backend-dev-guidelines` - FastAPI 專案結構
- `prisma-expert` - 資料庫 ORM 操作
- `api-patterns` - API 設計決策

### 品質與部署
- `testing-patterns` - 單元測試與整合測試
- `docker-expert` - 容器化最佳實踐
- `git-commit-helper` - Commit 訊息規範

---

## ⚠️ 重要提醒

1. **每次開發前**檢查對應的需求文件
2. **資料庫變更**必須使用 Alembic Migration
3. **API 變更**必須同步更新 API 文件
4. **新增 ETF**遵循 Phase 擴充計畫
5. **遇到問題時**使用 `error-resolver` SKILL 進行診斷

---

*最後更新: 2026-03-11*
