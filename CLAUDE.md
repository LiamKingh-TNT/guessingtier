@AGENTS.md

# Project Specification: Expo & React Native Tier-List Guessing Game APP

你現在是一位精通 React Native、Expo 生態系、Expo Router、Tailwind CSS (NativeWind) 以及 Firebase 的資深前端架構師。請根據以下規格說明，協助我開發這款 APP。

---

## 🛠 技術棧與架構要求 (Tech Stack)

- **框架**: Expo (React Native)
- **路由**: Expo Router (基於檔案系統的路由，支援 Tabs 與 Stack 嵌套)
- **樣式**: 支援 **Light / Dark Mode (深淺色模式切換)**（建議使用 NativeWind 或 Expo 的 `useColorScheme`）
- **後端/資料庫**: Firebase (Authentication & Firestore)

---

## 📱 頁面規劃 (App Pages / Routes)

APP 至少需要包含以下 5 個核心頁面，請規劃合理的 `app/` 目錄結構（包含 Tab 導航與 Auth 驗證流）：

1.  **登入頁 (Login Page)**: 用戶登入/註冊，對接 Firebase Auth。
2.  **首頁 (Home Page)**: 展示熱門或最新的題目列表，包含按讚數（likes）與瀏覽數（browses）。
3.  **用戶個人資料頁 (Profile Page)**: 顯示用戶個人資訊、切換深淺色模式的開關，以及該用戶創建的題目列表。
4.  **題目創建頁 (Create Challenge Page)**: 用戶可以創建 Tier List 題目，支援輸入文字、選擇 Tier 等級，並能上傳圖片（對接 Firebase Storage 或轉為 Base64 處理）。
5.  **猜題頁 (Guessing Game Page)**: 載入特定題目的遊戲互動頁面。

---


## 📊 資料結構 (Data Model - Firestore)

每一道題目（Challenge）在資料庫中的 JSON 格式定義如下，請嚴格遵守此結構進行 TypeScript 型別定義與資料操作：

```json
{
  "id": "XXX",
  "owner": "USER_ID_OR_NAME",
  "likes": 1,
  "browses": 1,
  "questions": [
    {
      "imagine": "IMAGE_URL_OR_BASE64",
      "tier": 0,
      "name": "項目名稱",
      "desc": "項目的詳細描述說明"
    }
  ]
}
```
