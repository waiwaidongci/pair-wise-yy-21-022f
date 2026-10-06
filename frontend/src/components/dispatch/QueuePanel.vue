<script setup lang="ts">
import type { QueueEntry, TicketDispatch } from "../../types/Dispatch";
import { formatDate } from "../../utils/formatters";

defineProps<{
  queue: QueueEntry[];
  tickets: TicketDispatch[];
}>();

function ticketOf(tickets: TicketDispatch[], id: number): TicketDispatch | undefined {
  return tickets.find((t) => t.id === id);
}
</script>

<template>
  <div class="panel">
    <h2>排队队列 <span class="count">{{ queue.length }}</span></h2>
    <div v-if="!queue.length" class="empty">暂无排队工单</div>
    <div v-for="q in queue" :key="q.id" class="queue-row">
      <div class="queue-main">
        <strong>#{{ q.ticket_id }}</strong>
        <span class="queue-addr">{{ ticketOf(tickets, q.ticket_id)?.address ?? "—" }}</span>
        <span class="queue-fault">{{ ticketOf(tickets, q.ticket_id)?.fault_type }}</span>
      </div>
      <div class="queue-reason">{{ q.reason }}</div>
      <div class="queue-meta">调度员 #{{ q.enqueued_by }} · {{ formatDate(q.enqueued_at) }}</div>
    </div>
  </div>
</template>

<style scoped>
.panel { background: #fbfaf4; border: 1px solid #d8d6c8; border-radius: 8px; padding: 18px; }
h2 { margin: 0 0 14px; font-size: 18px; display: flex; align-items: center; gap: 8px; }
.count { background: #d39b46; color: #fff; border-radius: 999px; font-size: 12px; padding: 1px 9px; }
.empty { border: 1px dashed #b8b09f; padding: 14px; border-radius: 8px; color: #8a8f86; text-align: center; }
.queue-row { display: grid; gap: 4px; padding: 10px 0; border-top: 1px solid #e4e0d3; }
.queue-main { display: flex; align-items: center; gap: 10px; }
.queue-addr { color: #274335; font-size: 14px; }
.queue-fault { font-size: 11px; background: #eef1e8; padding: 2px 8px; border-radius: 4px; color: #274335; }
.queue-reason { color: #9b1c1c; font-size: 13px; }
.queue-meta { color: #8a8f86; font-size: 12px; }
</style>
