<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useDispatchStore } from "../stores/DispatchStore";
import StatCard from "../components/common/StatCard.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityTag from "../components/common/PriorityTag.vue";

const store = useDispatchStore();

onMounted(() => store.load());

const stats = computed(() => [
  { label: "待派工", value: store.unassignedTickets.length },
  { label: "已占用/派工", value: store.occupiedTickets.length + (store.console?.tickets.filter((t) => t.dispatchState === "DISPATCHED").length ?? 0) },
  { label: "排队中", value: store.queue.length },
  { label: "待对账", value: store.reconciliations.length },
  { label: "值班班组", value: store.crews.filter((c) => c.duty_status === "ON_DUTY").length },
  { label: "在手任务总数", value: store.crews.reduce((s, c) => s + c.inHand, 0) }
]);

const recentTickets = computed(() => store.tickets.slice(0, 6));
</script>

<template>
  <section class="dashboard">
    <div class="stat-grid">
      <StatCard v-for="s in stats" :key="s.label" :label="s.label" :value="s.value" />
    </div>

    <div class="panel">
      <h2>抢修工单态势</h2>
      <div v-if="store.loading" class="empty">加载中…</div>
      <div v-else-if="!store.tickets.length" class="empty">暂无工单</div>
      <article v-for="t in recentTickets" :key="t.id" class="row">
        <strong>#{{ t.id }}</strong>
        <PriorityTag :title="t.priority" />
        <span class="addr">{{ t.address }}</span>
        <StatusBadge :value="t.dispatchState" />
      </article>
    </div>
  </section>
</template>

<style scoped>
.dashboard { display: grid; gap: 18px; }
.stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; }
.panel { background: #fbfaf4; border: 1px solid #d8d6c8; border-radius: 8px; padding: 18px; }
.panel h2 { margin: 0 0 14px; font-size: 18px; }
.empty { border: 1px dashed #b8b09f; padding: 14px; border-radius: 8px; color: #8a8f86; text-align: center; }
.row { display: grid; grid-template-columns: auto auto 1fr auto; align-items: center; gap: 12px; border-top: 1px solid #e4e0d3; padding: 12px 0; }
.addr { color: #274335; font-size: 14px; }
</style>
