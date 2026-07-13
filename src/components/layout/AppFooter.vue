<template>
  <footer class="flex flex-col items-center bg-[#E9EEFD]">
    <div
      class="flex flex-col items-center h-[210px] md:flex-row md:items-stretch md:justify-between md:w-full md:max-w-5xl md:h-[200px] md:mx-auto md:px-8 md:py-8"
    >
      <div class="flex flex-col pt-8 md:items-start md:pt-0 md:max-w-[240px]">
        <img
          class="w-[140px] h-[80px] object-contain md:w-[180px]"
          src="@/assets/images/PawPal_logo.PNG"
        />
        <p class="hidden text-[#6B7280] md:block text-sm">
          為毛孩家庭打造的即時照護平台,24 小時陪伴每一個緊急時刻。
        </p>
      </div>

      <div class="hidden md:flex md:flex-col md:items-start">
        <p class="mt-3 mb-4 text-[#3D4A7A] text-base font-medium">醫療專區</p>
        <ul class="cursor-pointer text-sm text-[#6B7280] space-y-1">
          <li class="hover:text-[#FFA002]">搜尋醫療院所</li>
          <li class="hover:text-[#FFA002]">AI 即時診斷</li>
          <li class="hover:text-[#FFA002]">緊急處置教學</li>
        </ul>
      </div>

      <div class="hidden md:flex md:flex-col md:items-start">
        <p class="mt-3 mb-4 text-[#3D4A7A] text-base font-medium">寵物知識+</p>
        <ul class="cursor-pointer text-sm text-[#6B7280] space-y-1">
          <li class="hover:text-[#FFA002]">經驗分享</li>
          <li class="hover:text-[#FFA002]">衛教文章</li>
          <li class="hover:text-[#FFA002]">小知識測驗</li>
        </ul>
      </div>

      <div class="flex flex-col items-center mb-6 md:items-start">
        <p class="mt-3 mb-4 text-[#3D4A7A] text-base font-medium">聯絡我們</p>
        <div class="cursor-pointer flex gap-2 mb-2">
          <img class="hover:opacity-70 w-[30px] h-[30px]" src="@/assets/icons/facebook-icon.svg" />
          <img class="hover:opacity-70 w-[35px] h-[35px]" src="@/assets/icons/instagram-icon.svg" />
          <img class="hover:opacity-70 w-[35px] h-[35px]" src="@/assets/icons/email-icon.svg" />
        </div>
        <p class="cursor-pointer hover:text-[#FFA002] hidden text-sm text-[#6B7280] md:block">
          hi@pawpal.tw
        </p>
      </div>
    </div>

    <div
      class="flex flex-col items-center justify-center gap-2 w-full h-[50px] bg-[#3D4A7A] sm:flex-row sm:gap-4"
    >
      <p class="text-sm text-[#E9EEFD]">© 2026 PawPal.All rights reserved.</p>
      <div class="flex items-center gap-3 text-xs text-[#E9EEFD]">
        <RouterLink to="/privacy-policy" class="hover:text-[#FFA002]">隱私權政策</RouterLink>
        <span class="text-[#E9EEFD]/50">|</span>
        <RouterLink to="/terms-of-service" class="hover:text-[#FFA002]">服務條款</RouterLink>
      </div>
    </div>
  </footer>
</template>
