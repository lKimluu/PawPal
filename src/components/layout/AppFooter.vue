<template>
  <footer
    class="grid h-[120px] w-full grid-cols-1 content-center gap-3 bg-[#3D4A7A] px-4 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-0 md:px-8"
  >
    <a
      href="https://github.com/pawpal-team/PawPal"
      target="_blank"
      rel="noopener noreferrer"
      class="justify-self-center text-xs font-medium text-[#E9EEFD] transition hover:text-brand-orange sm:text-sm md:ml-16 md:justify-self-start"
    >
      PawPal GitHub
    </a>
    <p class="text-center text-xs text-[#E9EEFD] sm:text-sm">© 2026 PawPal.All rights reserved.</p>

    <div class="flex items-center justify-self-end gap-3 text-xs text-[#E9EEFD] md:mr-16">
      <RouterLink to="/privacy-policy" class="hover:text-[#FFA002]">隱私權政策</RouterLink>
      <span class="text-[#E9EEFD]/50">|</span>
      <RouterLink to="/terms-of-service" class="hover:text-[#FFA002]">服務條款</RouterLink>
    </div>
  </footer>
</template>
