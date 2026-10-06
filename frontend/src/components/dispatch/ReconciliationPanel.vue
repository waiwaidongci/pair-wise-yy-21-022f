<script setup lang="ts">
import type { CrewAvailability, Reconciliation, TicketDispatch } from "../../types/Dispatch";
import { formatDate } from "../../utils/formatters";

const props = defineProps<{
  reconciliations: Reconciliation[];
  tickets: TicketDispatch[];
  crews: CrewAvailability[];
}>();

const emit = defineEmits<{ (e: "resolve", id: number): void }>();

function ticketOf(id: number) {
  return props.tickets.find((t) => t.id === id);
}
function crewName(id: number | null) {
  if (!id) return "—";
  return props.crews.find((c) => c.id === id)?.name ?? `班组#${id}`;
}
</script>

<template>
  <div class="panel">
    <h2>待对账 <span class="count count--alert">{{ reconciliations.length }}</span></h2>
    <div v-if="!reconciliations.length" class="empty">暂无待对账记录</div>
    <div v-for="r in reconciliations" :key="r.id" class="recon-row">
      <div class="recon-main">
        <strong>#{{ r.ticket_id }}</strong>
        <span class="recon-addr">{{ ticketOf(r.ticket_id)?.address ?? "—" }}</span>
      </div>
      <div class="recon-detail">
        旧回传 <strong>#{{ r.callback_id }}</strong>（{{ crewName(r.old_crew_id) }}）· 改派至 {{ crewName(r.new_crew_id) }}
      </div>
      <div class="recon-reason">{{ r.reason }}</div>
      <div class="recon-foot">
        <span class="recon-time">{{ formatDate(r.created_at) }}</span>
        <button class="btn btn--small" @click="emit('resolve', r.id)">核销对账</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel { background: #fbfaf4; border: 1px solid #d8d6c8; border-radius: 8px; padding: 18px; }
h2 { margin: 0 0 14px; font-size: 18px; display: flex; align-items: center; gap: 8px; }
.count { background: #d39b46; color: #fff; border-radius: 999px; font-size: 12px; padding: 1px 9px; }
.count--alert { background: #c0563b; }
.empty { border: 1px dashed #b8b09f; padding: 14px; border-radius: 8px; color: #8a8f86; text-align: center; }
.recon-row { display: grid; gap: 4px; padding: 10px 0; border-top: 1px solid #e4e0d3; }
.recon-main { display: flex; align-items: center; gap: 10px; }
.recon-addr { color: #274335; font-size: 14px; }
.recon-detail { font-size: 13px; color: #596257; }
.recon-reason { color: #9b1c1c; font-size: 13px; }
.recon-foot { display: flex; justify-content: space-between; align-items: center; }
.recon-time { color: #8a8f86; font-size: 12px; }
.btn { padding: 4px 12px; border-radius: 6px; border: 1px solid #274335; background: #274335; color: #f5f1e6; font-size: 12px; font-weight: 700; cursor: pointer; }
</style>
