<template>
  <u-navbar
      title-bold
      :is-back="showBack"
      :autoBack="false"
      title-color="#333333"
      :title="APP_NAME"
      :left-text="showBack ? '返回主页' : ''"
      @leftClick="handleBack"
  ></u-navbar>
</template>

<script setup>
import {APP_NAME} from "@/config";
import {toHome} from "@/utils/router";

const props = defineProps({
  showBack: {
    type: Boolean,
    default: false
  }
});

function handleBack() {
  if (!props.showBack) return;
  toHome();
}
</script>
