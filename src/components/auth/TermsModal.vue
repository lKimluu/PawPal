<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  type: { type: String, default: 'privacy' },
})

defineEmits(['close'])

// 會員服務條款
const TERMS_OF_SERVICE = {
  title: 'PawPal 會員服務使用條款',
  content: `歡迎您加入成為 PawPal 的會員並使用其所提供之寵物健康、行事曆管理等相關會員服務（以下稱會員服務）。所有使用本服務之使用者（以下稱會員），都應該詳細閱讀下列約定條款。當您完成註冊手續、或開始使用 PawPal 所提供之各項會員服務時，就視為您已閱讀、知悉、並完全同意本使用條款的所有約定：

一、 會員服務
1. PawPal 將依系統當時所建置的服務、項目、內容及功能對會員提供服務；我們保留隨時新增、減少或變更各該服務全部或一部之權利。
2. 我們保留隨時變更本使用條款、將免費服務改為收費服務、以及變更收費標準之權利，變更後之內容將公佈於網頁外，不另行個別通知。若您於變更後繼續使用本服務，視為已完全同意接受該等修改。
3. 未滿十八歲者，應於加入會員前將本服務條款請法定代理人（家長）或監護人閱讀，並得到其同意，才可以註冊及使用本服務。

二、 帳號、密碼註冊、登入與安全性
1. 會員應擔保註冊或登入流程中所提供之資料均為正確且即時。若所提供之資料不正確或與事實不符，我們保留不經事先通知，隨時拒絕或暫停對該會員提供相關會員服務之全部或一部之權利。
2. PawPal 提供使用者得使用第三方社群媒體（包括且不限於 Facebook、Google、LINE 等）註冊之帳號申請註冊、登入及使用會員服務。當使用者選擇前述方式時，即代表使用者同意並授權 PawPal 得與該等服務之提供者聯繫，並自該等服務提供者處取得使用者之會員帳號，並存取或處理使用者所儲存於該等服務之會員資料（如公開基本檔案、電子郵件等）。
3. 會員對於其帳號和密碼有妥善保管與保密之義務。任何使用特定會員帳號和密碼登入系統後之所有行為，均應由持有該帳號之會員負責。若發現被第三人冒用，會員應立即通知我們。

三、 資料儲存與免責排除
1. 會員應自行備份其所上傳、刊載或儲存於本服務系統內的所有寵物行程與相關資料。PawPal 不擔保會員所儲存的資料將全部被完整備份，亦不需對未備份、已刪除或備份失敗的資料負責。
2. 因不可抗力、天災、系統搬遷、更換或維修等非我們能完全控制之事由所致之服務停止或中斷，我們對會員因此所受之任何直接或間接損害，不負賠償責任。

四、 會員行為規範
會員必須遵守中華民國相關法令規範，且不得刊載、傳輸、發送或儲存任何誹謗、妨害名譽、色情、具歧視性、違反公序良俗、或侵害他人智慧財產權與個人資料之不當內容。若有違反，PawPal 有權不經通知直接加以刪除、移動或停止存取。

五、 準據法及管轄權
本使用條款均以中華民國法令為準據法。因會員服務所發生之爭議而需訴訟時，會員同意以臺灣臺北地方法院為第一審管轄法院。

最近更新日期：2026年7月10日`,
}

// 客戶隱私權條款
const PRIVACY_POLICY = {
  title: 'PawPal 客戶隱私權條款',
  content: `為了支持個人資料保護，維護個人隱私權，PawPal（以下稱本服務）謹以下列聲明，向您說明本服務蒐集個人資料之目的、類別、利用範圍及方式、以及您所得行使之權利等事項。當您使用本服務時，代表您同意我們根據本隱私權聲明所述內容，對您的個人資料進行蒐集、處理及利用：

一、 個人資料蒐集之方式
1. 當您申請註冊成為本服務之會員時。
2. 當您選擇使用 Google、LINE 等第三方帳號進行快捷登入與註冊時。
3. 當您使用本服務填寫寵物行事曆、留言或與客戶服務中心聯絡時。

二、 個人資料蒐集之目的
我們將於下列之特定目的範圍內，蒐集、處理、利用及傳輸您的個人資料：
1. 會員管理與服務（包括建立會員帳戶、售後客戶服務）。
2. 行事曆通知與提醒（包括依您設定之時間，透過 Email 等通訊管道發送寵物疫苗、健康、美容或看診之行程通知）。
3. 網路行為調查與市場分析（提升服務品質，進行不具名之整體數據分析）。

三、 個人資料蒐集之類別
依本服務性質，我們將向您蒐集以下資料：
1. 辨識個人者：包括但不限於姓名、大頭貼網址、社群媒體帳號、電子郵件地址（Email）、網際網路協定 IP 位址、Cookie 以及其他可辨識個人之裝置資訊。
2. 個人描述：如性別、出生年月日。
3. 寵物相關資訊：您所建立之寵物名稱、生日、體重、看診與行程記錄（不屬於個人隱私個資，僅作為行事曆運作之用）。

四、 個人資料的利用與對象
1. 廣告行銷與通知：我們將利用您所提供的 Email，自行寄發您訂閱的寵物健康資訊與系統通知。
2. 除非取得您的事先同意、或為履行合約義務之必要、或依照相關法令規定及有權主管機關之命令要求外，PawPal 絕不會將足以識別您身分的個人資料提供給任何無關的第三人。

五、 資料安全與當事人權利
1. 我們將以合於產業標準之合理技術（如 SSL 加密、安全伺服器）與程序，維護個人資料之安全。
2. 依據個人資料保護法第3條之規定，您可以向我們請求查詢、閱覽、複製、修改或更正您的個人資料。當蒐集目的消失時，您亦可要求停止處理或刪除資料。

六、 Cookie 之使用
為了便利使用者並提供更貼心的服務，本服務網站可能會使用 Cookie 技術。使用者可以經由瀏覽器的設定取消或限制此項功能，但可能因此無法使用部份網站功能。

最近更新日期：2026年7月10日`,
}

const modalData = computed(() => {
  return props.type === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        @click.self="$emit('close')"
      >
        <div
          class="modal-card relative flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white pb-6 pl-6 pr-2 shadow-2xl md:pb-8 md:pl-8 md:pr-3"
        >
          <div
            class="sticky top-0 z-10 flex items-center justify-between bg-white/95 py-5 pr-4 backdrop-blur-sm border-b border-slate-100 md:py-6 md:pr-5 mb-2"
          >
            <h2 class="text-xl font-bold tracking-wide text-brand-navy md:text-2xl">
              {{ modalData.title }}
            </h2>
            <button
              type="button"
              @click="$emit('close')"
              class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-50 text-xl text-slate-400 transition duration-200 hover:bg-slate-100 hover:text-slate-600 active:scale-95"
            >
              ⨉
            </button>
          </div>
          <div
            class="flex min-h-0 flex-1 flex-col overflow-y-auto pr-4 text-sm leading-relaxed text-brand-darkgray whitespace-pre-line md:pr-5"
          >
            {{ modalData.content }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .modal-card,
.fade-leave-active .modal-card {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.fade-enter-from .modal-card,
.fade-leave-to .modal-card {
  transform: scale(0.95);
}
</style>
