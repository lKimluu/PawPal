## Context

目前 `useAuthStore` 擁有 token、user、login 與 logout；`DashboardSidebar` 在呼叫 auth logout 後額外只重置 medical store。medical、growth、pet、calendar 都保存由目前帳號取得或選擇的資料，但只有 medical 提供 reset。若讓 auth store 直接 import 所有資料 store，calendar store 既有的 auth 依賴會形成 `auth → session cleanup → calendar → auth` 循環模組關係。

## Goals / Non-Goals

**Goals:**

- 提供單一 session lifecycle 入口，讓登入成功、登出與帳號切換都清除前一 session 的使用者資料。
- medical、growth、pet、calendar 各自擁有並測試自己的 reset 行為。
- auth store 繼續作為 token、user 與持久化認證資料的唯一來源。
- 登出元件只觸發 session logout，不需要知道有哪些資料 store。

**Non-Goals:**

- 不修改後端 API、JWT、localStorage key 或資料庫。
- 不重置 toast、sidebar、favoriteHospital 等非帳號資料；sidebar 的關閉仍由版面元件處理。
- 不導入 Pinia persistence plugin，也不依賴 Pinia 私有的 store registry。
- 不把各 store 的內部欄位集中到共用 reset 模組。

## Decisions

### 使用 session lifecycle store 作為登入與登出的協調入口

新增 `src/stores/session.js`，提供 `login(email, password)`、`logout()` 與 `resetSessionStores()` actions。session store 委派 `useAuthStore` 處理認證資料，並直接呼叫使用者範圍 stores 的公開 `reset()`。

選擇此方案是因為它讓 UI 只有一個 session 操作入口，同時避免 auth store 反向依賴 calendar 等資料 store。替代方案是讓 `DashboardSidebar` 逐一 reset，但會使每個 UI 登出入口都必須同步維護 store 清單；另一替代方案是從 Pinia 私有 registry 自動 reset 全部 store，但會依賴未公開 API 且錯誤清除純 UI 狀態。

### 每個使用者資料 store 自行實作 reset contract

medical 保留現有 `reset()`；growth、pet、calendar 新增同名 action。每個 action 將資料、選擇值、loading 與 error 還原到該 store 的初始狀態。session store 不直接修改其他 store 的 refs。

這保留狀態所有權並使單一 store 可獨立測試。替代方案是在 session store 直接指定各欄位，但任何 store 欄位變更都會造成跨模組修改。

### 僅在認證狀態確定轉換時重置

`session.login()` 等待 auth login 完成；失敗時保留現有 session 資料，成功時立即重置使用者資料，確保新 token 對應的畫面不沿用舊資料。`session.logout()` 先清除所有使用者資料，再清除 auth token 與 user；reset actions 必須是同步且不拋出預期錯誤。

替代方案是在每次 login request 前清除資料，但輸入錯誤密碼會不必要地抹除仍有效的畫面狀態。

### 登入與登出 UI 改用 session lifecycle store

`LoginForm`、`LoginView` 與 `DashboardSidebar` 的 session 操作改由 session store 執行。需要讀取 token 或登入狀態的其他元件仍使用 auth store，不做無關重構。

## Implementation Contract

- Behavior: 登出完成後，medical records、growth records、pet list、selected pet、calendar events 與 calendar selected pet 均回到初始值；下一個帳號登入前後都不得顯示上一個帳號的資料。
- Interface: `useSessionStore` 公開非同步 `login(email, password)`、同步 `logout()` 與同步 `resetSessionStores()`。`login` 回傳 auth login 原本的 result shape；`logout` 不變更既有路由導向責任。
- Store reset defaults:
  - medical: `records=[]`, `isLoading=false`, `errorMsg=''`
  - growth: `records=[]`, `isLoading=false`, `isSubmitting=false`, `errorMessage=null`
  - pet: `pets=[]`, `selectedPetId=null`, `isLoading=false`
  - calendar: `events=[]`, `selectedPetId='all'`, `isLoading=false`, `error=null`
- Failure modes: login API 失敗時不執行 reset，並原樣回傳失敗結果；reset 本身不發送 API request、不操作 router、不吞掉認證 API 錯誤。
- Acceptance criteria: Node 前端測試驗證每個 reset default、登入失敗不清除、登入成功清除、登出清除並移除 auth storage；執行 `npm run build` 成功。
- In scope: `src/stores/session.js`、auth/session 呼叫端、medical/growth/pet/calendar reset actions 與前端測試。
- Out of scope: backend、API response shape、全域 Pinia plugin、favoriteHospital 是否持久化、router guard 行為。

## Risks / Trade-offs

- [Risk] 新增 session store 後仍有元件直接呼叫 auth login/logout，繞過 cleanup → 將現有登入與登出呼叫端改用 session store，並以來源測試防止直接呼叫回歸。
- [Risk] 新增使用者資料 store 時忘記納入 cleanup → 在 session store 集中維護明確清單，新增帳號資料 store 時同步新增 reset contract 與測試。
- [Risk] 登入成功後 reset 與頁面載入同時發生造成競態 → session login 必須在 reset 完成後才回傳成功結果，呼叫端收到成功後才導頁或觸發資料取得。
