## Problem

地圖移動或縮放後會以 debounce 排程可視範圍查詢。若使用者在排程尚未執行時從列表選取醫院，程式化 `flyTo` 會直接開始，但既有排程仍可能在動畫途中讀取未穩定的 bounds 並發出查詢，之後最終 `moveend` 又再查詢一次。

## Root Cause

`MapView` 僅在元件卸載時取消 `boundsScheduler`；`focusSelectedHospital` 進入有效醫院的選取協調流程前沒有清除上一輪手動移動、縮放或初始化留下的 debounce 計時器。初版修正無條件取消排程，但 `selectedHospital` 為 `null` 時不會發生程式化移動，也沒有後續 `moveend` 補回查詢，因此會誤丟棄手動移動或定位平移所排定的合法 bounds refresh。

## Proposed Solution

只有在存在有效的 `selectedHospital`、即將開始程式化醫院聚焦時，才先取消現有的 bounds debounce 排程，再交由選取協調器執行聚焦。`selectedHospital` 為 `null` 時保留既有排程；有效聚焦則保留最終 `moveend` 的既有排程，使地圖穩定後仍只針對最終 viewport 查詢。

## Non-Goals

- 不調整 debounce 延遲時間。
- 不新增 bounds 差異比較或查詢去重規則。
- 不導入 Axios AbortController。
- 不修改後端 rate limit store 或身分計數策略。

## Success Criteria

- 程式化聚焦開始前，既有的 bounds debounce 已被取消。
- 聚焦前留下的計時器不會在 `flyTo` 途中發出 bounds 查詢。
- 最終 `moveend` 仍正常排程一次穩定 viewport 查詢。
- `selectedHospital` 為 `null` 時不取消手動移動或定位平移已排定的 bounds refresh。
- 手動拖曳、縮放、初始地圖載入與元件卸載行為維持正常。
- 前端相關測試與 `npm run build` 通過。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `hospital-api-integration`: 地圖僅在有效醫院即將被程式化聚焦時捨棄先前尚未執行的 bounds 排程；沒有有效選取時保留合法排程。

## Impact

- Affected code:
  - Modified: `src/components/hospital/MapView.vue`
  - Modified: `src/test/hospitalApiIntegration.test.js`
  - Modified: `src/test/hospitalMapSelection.test.js`
  - New: (none)
  - Removed: (none)
