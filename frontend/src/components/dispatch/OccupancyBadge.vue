<script setup lang="ts">
import type { Occupancy } from "../../types/Dispatch";
import { formatDate } from "../../utils/formatters";

defineProps<{ occupancy?: Occupancy }>();
</script>

<template>
  <span v-if="occupancy" class="occ-badge" :title="'占用时间 ' + formatDate(occupancy.held_at)">
    🔒 已占用 · 调度员 #{{ occupancy.dispatcher_id }}
  </span>
  <span v-else class="occ-badge occ-badge--free">未占用</span>
</template>

<style scoped>
.occ-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: #fde8e8;
  color: #9b1c1c;
  border: 1px solid #f5c2c2;
}
.occ-badge--free {
  background: #eef1e8;
  color: #596257;
  border-color: #d8d6c8;
}
</style>
