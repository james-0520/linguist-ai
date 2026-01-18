# 🎯 LinguistAI - 智慧文本校正專家

<div align="center">

**專業級中文文本校正與優化工具，由 Google Gemini AI 驅動**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## ✨ 功能特點

### 🔍 智慧分析
- **錯字與標點檢測** - 自動識別並修正錯別字、標點符號使用錯誤
- **冗贅詞優化** - 檢測並消除文本中的冗贅表達
- **流暢度調整** - 提升語句結構，使文本更加通順自然

### 📊 多級修改幅度
提供 5 種修改級別，滿足不同需求：
1. **精確校正（最保守）** - 僅修正明顯錯誤
2. **輕度優化** - 基本修正 + 輕微調整
3. **平衡優化（推薦）** - 全面校正 + 適度改寫
4. **深度優化** - 深度改寫 + 結構調整
5. **專業改寫（最進取）** - 全面重構，最大程度優化

### 📁 多格式支援
- ✅ 文本文件（`.txt`）
- ✅ PDF 文檔（`.pdf`）
- ✅ Word 文檔（`.docx`）
- ✅ 圖片文字辨識（`.png`, `.jpg`, `.jpeg`）

### 🎨 現代化介面
- 深色主題設計，護眼舒適
- 即時差異對照顯示
- 一鍵複製校正結果
- 支援拖放上傳文件
- 歷史記錄與復原功能（Ctrl+Z）

---

## 🚀 快速開始

### 環境需求

- **Node.js** 16.x 或更高版本
- **npm** 或 **yarn** 套件管理器
- **Gemini API Key** ([前往取得](https://aistudio.google.com/apikey))

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd linguist-ai
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **設定 API Key**
   
   在專案根目錄創建 `.env` 文件並添加您的 Gemini API Key：
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   
   # 選填：自訂使用的 Gemini 模型
   GEMINI_IMAGE_MODEL="gemini-3-flash-preview"
   GEMINI_TEXT_MODEL="gemini-3-pro-preview"
   ```

   > 💡 **提示**：
   > - 請確保 `.env` 文件已加入 `.gitignore`，避免洩露 API Key
   > - 模型設定為選填，不設定則使用系統預設值

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

5. **開啟瀏覽器**
   
   訪問 [http://localhost:3000](http://localhost:3000) 開始使用

---

## 📖 使用指南

### 基本使用流程

1. **輸入文本**
   - 直接在文本框中輸入或貼上內容
   - 點擊「上傳」按鈕選擇文件
   - 拖放圖片到文本框進行 OCR 識別

2. **設定選項**
   - 選擇需要的檢測項目（冗贅詞、流暢度）
   - 調整修改幅度滑桿（1-5 級）
   - 輸入風格傾向（選填，如：正式、口語、商務等）

3. **開始校正**
   - 點擊「開始校正」按鈕
   - 等待 AI 分析完成（通常 5-15 秒）

4. **查看結果**
   - 「分析總結」- 查看整體評估
   - 「差異對照」- 對比原文與修正後文本
   - 「修正詳情」- 查看每個修正項目的詳細說明

5. **使用結果**
   - 點擊「複製校正後內容」一鍵複製
   - 使用「校正後內容」開關切換顯示模式

### 快捷鍵

- **Ctrl/Cmd + Z** - 復原上一次文本變更（在非輸入狀態下）

---

## 🛠️ 技術架構

### 前端技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| React | 18.2 | UI 框架 |
| TypeScript | 5.8 | 類型安全 |
| Vite | 6.2 | 建置工具 |
| Tailwind CSS | 3.x | 樣式設計 |
| Google Gemini AI | 1.35 | AI 分析引擎 |

### 核心依賴

- **PDF.js** - PDF 文檔解析
- **Mammoth.js** - DOCX 文檔處理
- **Google Generative AI SDK** - Gemini API 整合

### 專案結構

```
linguist-ai/
├── components/          # React 元件
│   ├── Layout.tsx      # 頁面佈局
│   └── Switch.tsx      # 開關元件
├── services/           # 服務層
│   ├── geminiService.ts    # Gemini API 整合
│   └── browserService.ts   # 瀏覽器測試服務
├── App.tsx             # 主應用程式
├── index.tsx           # 應用程式入口
├── index.html          # HTML 模板
├── types.ts            # TypeScript 類型定義
├── vite.config.ts      # Vite 配置
└── tsconfig.json       # TypeScript 配置
```

---

## 📝 開發指令

```bash
# 開發模式
npm run dev

# 建置生產版本
npm run build

# 預覽生產版本
npm run preview
```

---

## 🔧 環境變數

在 `.env` 文件中配置以下變數：

| 變數名稱 | 說明 | 預設值 | 範例 |
|---------|------|-------|------|
| `GEMINI_API_KEY` | Google Gemini API 金鑰（必填） | - | `AIzaSy...` |
| `GEMINI_IMAGE_MODEL` | 圖片文字辨識使用的模型 | `gemini-3-flash-preview` | `gemini-3-flash-preview` |
| `GEMINI_TEXT_MODEL` | 文字分析使用的模型 | `gemini-3-pro-preview` | `gemini-3-pro-preview` |

### 範例 `.env` 配置

```env
GEMINI_API_KEY="your_gemini_api_key_here"

# Gemini 模型設定（可選，使用預設值即可）
GEMINI_IMAGE_MODEL="gemini-3-flash-preview"
GEMINI_TEXT_MODEL="gemini-3-pro-preview"
```

> 💡 **提示**：如果不設定 `GEMINI_IMAGE_MODEL` 和 `GEMINI_TEXT_MODEL`，系統會自動使用預設模型。

---

## 🎨 功能展示

### 主介面
- 深色質感設計
- 雙欄響應式佈局
- 即時字數統計

### 分析結果
- 彩色差異標記（刪除/新增）
- 分類標籤（錯字/冗贅/流暢度）
- 詳細修正原因說明

---

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 本專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📄 授權協議

本專案採用 MIT 授權協議 - 詳見 [LICENSE](LICENSE) 文件

---

## 📧 聯絡方式

如有任何問題或建議，歡迎聯繫：

- 🐛 [回報問題](https://github.com/your-repo/issues)
- 💡 [功能建議](https://github.com/your-repo/discussions)

---

## 🙏 致謝

- [Google Gemini](https://ai.google.dev/) - 提供強大的 AI 分析能力
- [Vite](https://vitejs.dev/) - 快速的建置工具
- [Tailwind CSS](https://tailwindcss.com/) - 優雅的樣式框架
- [React](https://reactjs.org/) - 強大的 UI 框架

---

<div align="center">

**如果這個專案對您有幫助，請給個 ⭐️ Star！**

Made with ❤️ by LinguistAI Team

</div>
