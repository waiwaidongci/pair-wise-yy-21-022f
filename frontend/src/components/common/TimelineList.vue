<script setup lang="ts">
import EmptyState from "./EmptyState.vue";

export interface TimelineItem {
  id: string | number;
  time: string;
  title: string;
  desc?: string;
  tone?: "ok" | "warn" | "bad" | "";
}

defineProps<{ items: TimelineItem[] }>();

const formatTime = (value: string) => (value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "—");
</script>

<template>
  <EmptyState v-if="items.length === 0" />
  <ul v-else class="timeline">
    <li v-for="item in items" :key="item.id" :class="item.tone ?? ''">
      <span class="time">{{ formatTime(item.time) }}</span>
      <strong>{{ item.title }}</strong>
      <span v-if="item.desc" class="desc">{{ item.desc }}</span>
    </li>
  </ul>
</template>
