<script setup></script>

<template>
  <div class="flex items-center justify-center" role="status" aria-label="載入中">
    <div class="relative h-9 w-9 shrink-0">
      <img
        src="@/assets/icons/pet-loading.svg"
        class="h-9 w-9 animate-cat-bounce"
        alt=""
        aria-hidden="true"
      />
      <span class="absolute bottom-1 left-full ml-1 flex items-end gap-0.5">
        <span class="h-1 w-1 animate-loading-dot rounded-full bg-brand-orange"></span>
        <span class="h-1 w-1 animate-loading-dot rounded-full bg-brand-orange [animation-delay:150ms]"></span>
        <span class="h-1 w-1 animate-loading-dot rounded-full bg-brand-orange [animation-delay:300ms]"></span>
      </span>
    </div>
  </div>
</template>
