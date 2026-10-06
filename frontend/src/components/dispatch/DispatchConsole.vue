<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useDispatchStore } from "../../stores/DispatchStore";
import { useCrewAvailability } from "../../hooks/useCrewAvailability";
import CrewCard from "./CrewCard.vue";
import QueuePanel from "./QueuePanel.vue";
import ReconciliationPanel from "./ReconciliationPanel.vue";
import CallbackPanel from "./CallbackPanel.vue";
import OccupancyBadge from "./OccupancyBadge.vue";
import { DispatchStateText } from "../../constants/dispatch";
import { formatDate } from "../../utils/formatters";
import type { TicketDispatch } from "../../types/Dispatch";

const dispatchStore = useDispatchStore();
const { crewById } = useCrewAvailability(computed(() => dispatchStore.crews));

const selectedTicketId = ref<number | null>(null);
const callbackCrewId = ref<number>(1);
const banner = ref<{ type: "ok" | "warn" | "err"; text: string } | null>(null);

const tickets = computed(() => dispatchStore.tickets);
const crews = computed(() => dispatchStore.crews);
const queue = computed(() => dispatchStore.queue);
const reconciliations = computed(() => dispatchStore.reconciliations);
const occupancies = computed(() => dispatchStore.occupancies);

const selectedTicket = computed(() => tickets.value.find((t) => t.id === selectedTicketId.value) ?? null);

const callbackTickets = computed(() =>
  tickets.value.filter((t) => t.team_id === callbackCrewId.value && t.dispatchState !== "UNASSIGNED")
);

onMounted(() => {
  void dispatchStore.load();
});

function selectTicket(t: TicketDispatch) {
  if (t.dispatchState !== "UNASSIGNED") return;
  selectedTicketId.value = t.id;
  banner.value = null;
}

async function onEvaluate(crewId: number) {
  if (selectedTicketId.value == null) return;
  await dispatchStore.evaluate(selectedTicketId.value, crewId);
}

async function onConfirm(crewId: number) {
  if (selectedTicketId.value == null) return;
  banner.value = null;
  try {
    const result = await dispatchStore.confirm(selectedTicketId.value, crewId);
    if (result.status === "OCCUPIED") {
      banner.value = { type: "ok", text: `已占用名额，派工成功（占用记录 #${result.occupancy?.id}）` };
    } else if (result.status === "CONFLICT") {
      const name = result.occupier ? `${result.occupier.name}` : "";
      banner.value = {
        type: "err",
        text: `该工单已被调度员 #${result.occupancy?.dispatcher_id} ${name} 占用，无法重复派工`
      };
    } else if (result.status === "QUEUED") {
      banner.value = { type: "warn", text: `班组容量不足，已进入排队：${result.evaluation?.reasons.join("；")}` };
    }
  } catch (e) {
    banner.value = { type: "err", text: (e as Error).message };
  }
}

async function onResolve(id: number) {
  await dispatchStore.resolveReconciliation(id);
}

function switchDispatcher(id: number) {
  dispatchStore.setDispatcher(id);
  banner.value = null;
}

function stateClass(state: string) {
  return {
    UNASSIGNED: "state--unassigned",
    QUEUED: "state--queued",
    OCCUPIED: "state--occupied",
    DISPATCHED: "state--dispatched"
  }[state];
}
</script>

<template>
  <div class="console">
    <header class="console-head">
      <div>
        <h2>可续作调度台</h2>
        <p class="sub">按技能、在手任务和备件判断能否接单；容量不足先排队；派工确认占用名额；断网回传恢复后合并；改派旧回传失效待对账。</p>
      </div>
      <div class="console-tools">
        <div class="dispatcher-switch">
          <span>调度员</span>
          <button
            v-for="id in [1, 2]"
            :key="id"
            :class="{ active: dispatchStore.dispatcherId === id }"
            @click="switchDispatcher(id)"
          >#{{ id }}</button>
        </div>
        <button class="btn btn--ghost" @click="dispatchStore.load()">刷新</button>
      </div>
    </header>

    <div v-if="banner" class="banner" :class="'banner--' + banner.type">{{ banner.text }}</div>
    <div v-if="dispatchStore.error" class="banner banner--err">{{ dispatchStore.error }}</div>

    <div class="console-grid">
      <section class="panel tickets-panel">
        <h3>抢修工单 <span class="hint">点选待派工工单后评估班组</span></h3>
        <div v-for="t in tickets" :key="t.id" class="ticket-card" :class="[stateClass(t.dispatchState), { selected: selectedTicketId === t.id }]" @click="selectTicket(t)">
          <div class="ticket-main">
            <strong>#{{ t.id }}</strong>
            <span class="ticket-prio">{{ t.priority }}</span>
            <span class="ticket-addr">{{ t.address }}</span>
          </div>
          <div class="ticket-meta">
            <span class="fault-tag">{{ t.fault_type }}</span>
            <span class="state-tag" :class="stateClass(t.dispatchState)">{{ DispatchStateText[t.dispatchState] }}</span>
            <OccupancyBadge v-if="t.dispatchState === 'OCCUPIED'" :occupancy="t.occupancy" />
            <span v-if="t.dispatchState === 'QUEUED'" class="queue-reason">{{ t.queueEntry?.reason }}</span>
            <span v-if="t.dispatchState === 'DISPATCHED'" class="dispatched-crew">{{ crewById(t.team_id)?.name ?? "" }}</span>
          </div>
        </div>
      </section>

      <section class="panel crews-panel">
        <h3>班组能力 <span class="hint">{{ selectedTicket ? `工单 #${selectedTicket.id} · ${selectedTicket.fault_type}` : "请先选择工单" }}</span></h3>
        <div class="crew-grid">
          <CrewCard
            v-for="c in crews"
            :key="c.id"
            :crew="c"
            :selected-ticket-id="selectedTicketId"
            :evaluation="selectedTicketId != null ? dispatchStore.evaluationFor(selectedTicketId, c.id) : undefined"
            :locked="selectedTicket?.dispatchState === 'OCCUPIED'"
            @evaluate="onEvaluate"
            @confirm="onConfirm"
          />
        </div>
      </section>
    </div>

    <div class="console-grid console-grid--bottom">
      <QueuePanel :queue="queue" :tickets="tickets" />
      <ReconciliationPanel :reconciliations="reconciliations" :tickets="tickets" :crews="crews" @resolve="onResolve" />
      <CallbackPanel :crew-id="callbackCrewId" :tickets="callbackTickets" />
    </div>

    <footer class="console-foot">
      <span>占用 {{ occupancies.length }} · 排队 {{ queue.length }} · 待对账 {{ reconciliations.length }}</span>
      <span>数据持久化于后端，重开页面队列/占用/待对账均保留 · {{ formatDate(new Date().toISOString()) }}</span>
    </footer>
  </div>
</template>

<style scoped>
.console { display: grid; gap: 16px; }
.console-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.console-head h2 { margin: 0 0 4px; font-size: 22px; }
.sub { margin: 0; color: #596257; font-size: 13px; max-width: 720px; }
.console-tools { display: flex; align-items: center; gap: 10px; }
.dispatcher-switch { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #596257; }
.dispatcher-switch button { padding: 4px 10px; border-radius: 6px; border: 1px solid #b8b09f; background: #fff; cursor: pointer; font-weight: 700; }
.dispatcher-switch button.active { background: #274335; color: #f5f1e6; border-color: #274335; }
.btn { padding: 6px 12px; border-radius: 6px; border: 1px solid transparent; font-size: 13px; font-weight: 700; cursor: pointer; }
.btn--ghost { background: transparent; border-color: #b8b09f; color: #274335; }
.banner { padding: 10px 14px; border-radius: 8px; font-size: 14px; font-weight: 600; }
.banner--ok { background: #e4efe4; color: #244b31; border: 1px solid #b8d8b8; }
.banner--warn { background: #f0e6d2; color: #7d4d18; border: 1px solid #e0c89a; }
.banner--err { background: #fde8e8; color: #9b1c1c; border: 1px solid #f5c2c2; }
.console-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.console-grid--bottom { grid-template-columns: 1fr 1fr 1fr; }
.panel { background: #fbfaf4; border: 1px solid #d8d6c8; border-radius: 8px; padding: 16px; }
.panel h3 { margin: 0 0 12px; font-size: 16px; display: flex; align-items: center; gap: 8px; }
.hint { font-size: 12px; font-weight: 400; color: #8a8f86; }
.tickets-panel { align-content: start; }
.ticket-card { border: 1px solid #e4e0d3; border-radius: 8px; padding: 12px; margin-bottom: 10px; cursor: default; display: grid; gap: 6px; }
.ticket-card.state--unassigned { cursor: pointer; border-color: #b8d8b8; }
.ticket-card.state--unassigned:hover { background: #f1f7f1; }
.ticket-card.selected { border-color: #274335; box-shadow: 0 0 0 2px rgba(39, 67, 53, 0.15); }
.ticket-main { display: flex; align-items: center; gap: 10px; }
.ticket-prio { font-size: 11px; background: #f0e6d2; color: #7d4d18; padding: 2px 8px; border-radius: 4px; font-weight: 700; }
.ticket-addr { color: #274335; font-size: 14px; }
.ticket-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; }
.fault-tag { background: #eef1e8; padding: 2px 8px; border-radius: 4px; color: #274335; }
.state-tag { padding: 2px 8px; border-radius: 4px; font-weight: 700; }
.state--unassigned .state-tag { background: #e4efe4; color: #244b31; }
.state--queued .state-tag { background: #f0e6d2; color: #7d4d18; }
.state--occupied .state-tag { background: #fde8e8; color: #9b1c1c; }
.state--dispatched .state-tag { background: #eef1e8; color: #596257; }
.queue-reason { color: #9b1c1c; }
.dispatched-crew { color: #596257; }
.crew-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-content: start; }
.console-foot { display: flex; justify-content: space-between; color: #8a8f86; font-size: 12px; padding: 4px 2px; }
@media (max-width: 1100px) { .console-grid, .console-grid--bottom { grid-template-columns: 1fr; } }
</style>
