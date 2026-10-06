<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ value: string }>();
const text = computed(() => ({ P1: "P1 特急", P2: "P2 加急", P3: "P3 常规" })[props.value] ?? props.value);
</script>

<template>
  <span class="priority-tag" :class="value.toLowerCase()">{{ text }}</span>
</template>
