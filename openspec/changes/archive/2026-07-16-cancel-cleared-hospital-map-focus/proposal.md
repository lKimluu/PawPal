## Problem

清空目前選取醫院時，`MapView` 會在取消 `boundsScheduler` 前提前返回，但同時略過 selection coordinator 的 cleanup。若先前的聚焦流程仍在等待 `moveend`、cluster reveal 或 popup 開啟，過期 callback 仍可能完成並重新開啟已取消醫院的 popup。

此外，若 bounds 回應在聚焦期間更新 `validHospitals`，selection coordinator 會先排入 marker 同步；此時清空選取會取消舊聚焦，卻也可能丟棄該同步，讓地圖暫時保留舊 markers。

即使過期 callback 與 marker 同步已正確處理，清空選取若發生在 `flyTo` 動畫期間，目前仍只移除 `moveend` listener，沒有停止動畫；畫面可能繼續移動並置中到已取消選取的醫院。

此外，先前封存 change 寫入 `hospital-api-integration` 主規格的 `@trace` 含有大量與需求無關的檔案與測試，降低規格追蹤可信度。

## Root Cause

`focusSelectedHospital` 把「沒有有效選取時不要取消 bounds callback」與「沒有有效選取時不需要通知 selection coordinator」視為同一個提前返回條件。前者符合規格，後者會留下未完成的 selection work。selection coordinator 的 `focus()` 也會在判斷 hospital 無效並返回前重設 `syncQueued`，因此取消聚焦時無法完成已排入的 marker 同步；修正同步後，無效 hospital 分支仍在呼叫 `map.stop()` 前返回，因此 coordinator 啟動的 `flyTo` 不會隨 focus 一起取消。主規格 trace 則未限縮到實際 implementation commit 的檔案集合。

## Proposed Solution

- 清空選取時呼叫 `selectionCoordinator.focus(null)`，利用既有 generation 與 listener cleanup 取消過期 selection work。
- 若取消聚焦時已有 marker 同步排隊，取消舊 work 後立即以最新 `validHospitals` 重建 markers，且不恢復已取消的 popup。
- 清空選取時若 coordinator 啟動的 `flyTo` 仍在等待 `moveend`，先移除過期 listener，再呼叫 `map.stop()` 停在取消當下的 viewport；若移動已完成而只剩 reveal 或 popup work，則不額外停止地圖。
- 僅在有有效選取醫院、即將開始 programmatic focus 時取消 `boundsScheduler`。
- 補上回歸測試，驗證清空選取會取消舊 popup/reveal callback，且保留既有 bounds callback。
- 將該 requirement 的 `@trace` 限縮為實際相關的地圖元件與兩個前端測試檔。

## Non-Goals

- 不改變 bounds debounce 時間、API contract、地圖群聚或 popup 視覺。
- 不改變 Leaflet 在使用者拖曳、放大或縮小時中止 programmatic focus 與 popup 的既有互動。
- 不在沒有 coordinator movement 的一般清除選取或 reveal cleanup 中呼叫 `map.stop()`。
- 不修改其他已封存 change 的歷史 artifacts。

## Success Criteria

- 清空選取後，舊的 `moveend`、cluster reveal 或 popup callback 不得開啟已取消醫院的 popup。
- 清空選取不得取消已排程的 bounds refresh。
- 清空選取不得丟棄聚焦期間已排入的 marker 同步；最新 bounds 回應的 markers 必須完成重建，且不得恢復已取消的 popup 或移動 viewport。
- 清空選取若發生在 `flyTo` 完成前，地圖必須停止在取消當下，不得繼續移向已取消醫院；停止前必須先移除過期 `moveend` listener。
- 有效醫院聚焦仍會先取消舊 bounds callback，再開始新的 selection focus。
- `node --test src/test/hospitalMapSelection.test.js src/test/hospitalApiIntegration.test.js` 與 `npm run build` 通過。
- 主規格 trace 僅列出本需求實際相關檔案。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `hospital-api-integration`: 釐清清空醫院選取時必須取消舊 selection work 與未完成的 programmatic movement，同時保留 pending bounds refresh 與已排入的 marker 同步。

## Impact

- Affected specs: `hospital-api-integration`
- Affected code:
  - Modified: `src/components/hospital/MapView.vue`
  - Modified: `src/utils/hospitalMapSelection.js`
  - Modified: `src/test/hospitalMapSelection.test.js`
  - Modified: `src/test/hospitalApiIntegration.test.js`
  - Modified: `openspec/specs/hospital-api-integration/spec.md`
  - New: `openspec/changes/cancel-cleared-hospital-map-focus/specs/hospital-api-integration/spec.md`
  - New: `openspec/changes/cancel-cleared-hospital-map-focus/tasks.md`
  - Removed: none
