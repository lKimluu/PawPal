## 1. 路由層級程式碼拆分

- [x] 1.1 依「使用 Vue Router 路由層級動態匯入」決策實作「Hospital map code is loaded on demand」：保留 Home route eager loading，將 Login、Register、ForgotPassword、Medical、Dashboard、Growth、BaseModalPreview、Hospital 與 NotFound route views 改為動態載入，同時保持所有 route name、URL 與 metadata；以既有測試及 `npm run build` 驗證各非首頁頁面產生按需 chunk、Hospital/Leaflet chunks 獨立、建置成功且不再出現超過 500 kB 的 JavaScript chunk warning。
