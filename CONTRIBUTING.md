# 貢獻指南

感謝您對 ETF Backtester 的興趣！以下是參與貢獻的指南。

## 🚀 快速開始

1. **Fork 倉庫**
   ```bash
   git clone https://github.com/oscar120601/etf-backtester.git
   cd etf-backtester
   ```

2. **建立分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **開發環境設定**
   ```bash
   # Windows 一鍵啟動
   start-dev.bat
   ```

## 📝 提交規範

### Commit Message 格式
```
類型: 簡短描述

詳細說明（可選）
```

**類型**:
- `feat`: 新功能
- `fix`: 修復錯誤
- `docs`: 文件更新
- `style`: 格式調整（不影響代碼邏輯）
- `refactor`: 重構
- `perf`: 效能優化
- `test`: 測試

### 示例
```
feat: 添加 VGK 歐洲 ETF 支援

- 更新 ETF 匯入腳本
- 添加價格數據生成
```

## 🎯 開發優先級

### 歡迎貢獻的領域

1. **Phase 3 ETF 擴充** (P0)
   - 參見 [ROADMAP-v1.1.md](./ROADMAP-v1.1.md)
   - 添加全球市場 ETF（VGK, VPL, VWO 等）

2. **測試覆蓋** (P1)
   - 後端單元測試
   - 前端組件測試

3. **文件改進** (P2)
   - API 文件
   - 使用教學
   - 程式碼註釋

4. **效能優化** (P2)
   - 大型資料集處理
   - 圖表渲染優化

## 🐛 回報 Bug

請使用 [GitHub Issues](https://github.com/oscar120601/etf-backtester/issues) 並包含：

1. **環境資訊**
   - OS: Windows/macOS/Linux
   - Python 版本
   - Node.js 版本

2. **問題描述**
   - 預期行為
   - 實際行為
   - 重現步驟

3. **錯誤訊息**
   - 完整的錯誤堆疊
   - 截圖（如適用）

## 💡 提出建議

1. 先搜尋現有的 Issues 避免重複
2. 清楚描述功能的用途和價值
3. 如可能，提供使用場景示例

## 🔧 開發規範

### TypeScript
- 啟用嚴格模式
- 所有函數需有返回類型
- 避免使用 `any`

### Python
- 使用 Type hints
- 函數需有 docstring
- 遵循 PEP 8

### 資料庫變更
- 使用 Alembic Migration
- 禁止直接修改 production 資料庫

## ✅ Pull Request 檢查清單

- [ ] 代碼已通過 TypeScript 編譯（`npm run build`）
- [ ] 後端測試通過（如有）
- [ ] 文件已更新
- [ ] Commit message 符合規範
- [ ] 無未使用的變數或導入

## 📞 聯繫方式

- GitHub Issues: https://github.com/oscar120601/etf-backtester/issues
- 開發討論：在 Issue 中標記 `discussion` 標籤

---

**感謝您的貢獻！** 🎉
