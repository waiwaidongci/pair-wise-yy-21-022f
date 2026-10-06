<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRef } from "vue";
import { useDispatchStore } from "../stores/DispatchStore";
import { useDispatchEligibility } from "../hooks/useDispatchEligibility";
import { DISPATCHERS } from "../constants/Dispatchers";
import { TicketStatusZh, type TicketStatus } from "../constants/TicketStatus";
import { CrewReportType, CrewReportTypeText } from "../constants/CrewReportType";
import type { DispatchCrew } from "../types/Dispatch";
import StatCard from "../components/common/StatCard.vue";
import StatusBadge from "../components/common/StatusBadge.vue";
import PriorityTag from "../components/common/PriorityTag.vue";
import CrewCard from "../components/common/CrewCard.vue";
import TimelineList from "../components/common/TimelineList.vue";
import EmptyState from "../components/common/EmptyState.vue";

const store = useDispatchStore();
const selectedTicketId = computed({
  get: () => store.selectedTicketId,
  set: (id: number) => store.selectTicket(id)
});
const { selectedTicket, eligibilityFor, holdOfSelected, queueOfSelected, holdCountdown } =
  useDispatchEligibility(toRef(store, "data"), selectedTicketId);

const reportCrewId = ref(0);
const reportTicketId = ref(0);
const reportType = ref<(typeof CrewReportType)[number]>("ARRIVED");
const reportContent = ref("");
const reassignReason = ref("");
const resolveNote = ref("");

const statusZh = (status: string) => TicketStatusZh[status as TicketStatus] ?? status;
const crewName = (id: number) => store.data?.crews.find((c) => c.id === id)?.name ?? `#${id}`;
const partName = (code: string) => store.data?.part_stock.find((p) => p.part_code === code)?.part_name ?? code;
const partStock = (code: string) => store.data?.part_stock.find((p) => p.part_code === code)?.stock ?? 0;

const holdOf = (ticketId: number) => store.holdOf(ticketId);
const queueOf = (ticketId: number) => store.queueOf(ticketId);
const heldByMe = (ticketId: number) => holdOf(ticketId)?.dispatcher === store.dispatcher;
const heldByOther = (ticketId: number) => {
  const hold = holdOf(ticketId);
  return !!hold && hold.dispatcher !== store.dispatcher;
};

/** 排队入口：仅技能/值班达标但容量或备件暂不满足时可排（与后端 enqueue 规则一致）。 */
const canQueue = (crewId: number) => {
  const eligibility = eligibilityFor.value[crewId];
  if (!eligibility || eligibility.ok) return false;
  return !eligibility.reasons.some((r) => ["CREW_OFF_DUTY", "SKILL_MISMATCH"].includes(r.code));
};

const reportCrew = computed(() => store.data?.crews.find((c) => c.id === reportCrewId.value) ?? null);
const reportCrewTickets = computed(() =>
  (store.data?.tickets ?? []).filter((t) => t.team_id === reportCrewId.value && ["ASSIGNED", "ARRIVED", "REPAIRING"].includes(t.status))
);
const outboxOf = (crewId: number) => store.outbox[crewId] ?? [];

const reportTimeline = computed(() =>
  (store.data?.reports ?? []).map((r) => ({
    id: r.client_report_id,
    time: r.merged_at,
    title: `${crewName(r.crew_id)} · 工单#${r.ticket_id} · ${CrewReportTypeText[r.type]}`,
    desc: `${r.content || "—"}${r.status === "INVALID" ? "（已判废，待对账）" : ""}`,
    tone: r.status === "INVALID" ? ("bad" as const) : ("ok" as const)
  }))
);

const logTimeline = computed(() =>
  (store.data?.logs ?? []).map((log, index) => ({
    id: index,
    time: log.time,
    title: log.template,
    desc: `${log.actor} · ${log.detail}`,
    tone: "" as const
  }))
);

const submitReport = async () => {
  if (!reportCrewId.value || !reportTicketId.value) return;
  await store.submitReport(reportCrewId.value, reportTicketId.value, reportType.value, reportContent.value);
  reportContent.value = "";
};

let timer: ReturnType<typeof setInterval> | undefined;
onMounted(async () => {
  await store.refresh();
  if (!selectedTicketId.value && store.waitingTickets.length > 0) {
    selectedTicketId.value = store.waitingTickets[0].id;
  }
  if (!reportCrewId.value && store.data?.crews.length) reportCrewId.value = store.data.crews[0].id;
  // 定时刷新让另一个调度员/另一个标签页的占用与排队变化可见。
  timer = setInterval(() => store.refresh(), 10_000);
});
onUnmounted(() => timer && clearInterval(timer));
</script>

<template>
  <section class="dispatch">
    <div class="toolbar">
      <label>
        当前调度员
        <select :value="store.dispatcher" @change="store.setDispatcher(($event.target as HTMLSelectElement).value)">
          <option v-for="d in DISPATCHERS" :key="d.id" :value="d.name">{{ d.name }}</option>
        </select>
      </label>
      <span class="hint">开两个浏览器标签页选不同调度员，可演示同一单的占用冲突</span>
      <span class="spacer" />
      <button type="button" class="btn" @click="store.refresh()">刷新</button>
      <button type="button" class="btn ghost" @click="store.reset()">重置演示数据</button>
    </div>

    <div v-if="store.error" class="banner error">
      <strong>{{ store.error.code }}</strong> {{ store.error.message }}
      <button type="button" class="btn ghost" @click="store.dismissError()">知道了</button>
    </div>
    <div v-if="store.notice" class="banner ok">
      {{ store.notice }}
      <button type="button" class="btn ghost" @click="store.dismissNotice()">知道了</button>
    </div>

    <section class="metrics">
      <StatCard label="待派工工单" :value="store.waitingTickets.length" />
      <StatCard label="占用中" :value="store.data?.holds.length ?? 0" />
      <StatCard label="排队中" :value="store.data?.queue.length ?? 0" />
      <StatCard label="待对账" :value="store.pendingReconciliations.length" />
    </section>

    <section class="dispatch-grid">
      <div class="panel">
        <h2>待派工工单</h2>
        <EmptyState v-if="store.waitingTickets.length === 0" />
        <article
          v-for="ticket in store.waitingTickets"
          :key="ticket.id"
          class="ticket-card"
          :class="{ selected: ticket.id === selectedTicketId }"
          @click="selectedTicketId = ticket.id"
        >
          <header>
            <PriorityTag :value="ticket.priority" />
            <strong>#{{ ticket.id }}</strong>
            <StatusBadge :value="statusZh(ticket.status)" />
          </header>
          <p>{{ ticket.summary }}</p>
          <p class="meta">
            需技能「{{ ticket.required_skill }}」
            <template v-if="ticket.required_part_code">
              · 备件 {{ partName(ticket.required_part_code) }} ×{{ ticket.required_part_qty }}（余 {{ partStock(ticket.required_part_code) }}）
            </template>
          </p>
          <p v-if="holdOf(ticket.id)" class="hold-line" :class="{ mine: heldByMe(ticket.id) }">
            {{ heldByMe(ticket.id) ? "我已占用" : `被 ${holdOf(ticket.id)?.dispatcher} 占用` }}
          </p>
          <p v-if="queueOf(ticket.id)" class="queue-line">
            已排队 → {{ queueOf(ticket.id)?.crew_name }} 第 {{ queueOf(ticket.id)?.position }} 位（{{ queueOf(ticket.id)?.queued_by }}）
          </p>
          <footer @click.stop>
            <button v-if="!holdOf(ticket.id)" type="button" class="btn" @click="store.hold(ticket.id)">占用</button>
            <button v-else-if="heldByMe(ticket.id)" type="button" class="btn ghost" @click="store.release(ticket.id)">释放占用</button>
          </footer>
        </article>
      </div>

      <div class="panel">
        <h2>班组接单判断<small v-if="selectedTicket">（工单#{{ selectedTicket.id }}）</small></h2>
        <EmptyState v-if="!selectedTicket" />
        <template v-else>
          <p v-if="holdOfSelected" class="hold-line" :class="{ mine: holdOfSelected.dispatcher === store.dispatcher }">
            {{ holdOfSelected.dispatcher === store.dispatcher ? "我已占用" : `被 ${holdOfSelected.dispatcher} 占用` }}，{{ holdCountdown }}s 后过期
          </p>
          <p v-if="queueOfSelected" class="queue-line">已排入 {{ queueOfSelected.crew_name }} 队列，可在右侧面板叫号或取消</p>
          <CrewCard
            v-for="crew in store.data?.crews ?? []"
            :key="crew.id"
            :crew="crew"
            :eligibility="eligibilityFor[crew.id] ?? null"
          >
            <template #actions>
              <button
                v-if="eligibilityFor[crew.id]?.ok"
                type="button"
                class="btn primary"
                :disabled="heldByOther(selectedTicket.id)"
                @click="store.confirm(selectedTicket.id, crew.id)"
              >确认派工</button>
              <button
                v-if="canQueue(crew.id) && !queueOfSelected"
                type="button"
                class="btn"
                :disabled="heldByOther(selectedTicket.id)"
                @click="store.enqueue(selectedTicket.id, crew.id)"
              >先排队</button>
            </template>
          </CrewCard>
        </template>
      </div>

      <div class="panel-stack">
        <div class="panel">
          <h2>排队队列</h2>
          <EmptyState v-if="(store.data?.queue ?? []).length === 0" />
          <article v-for="entry in store.data?.queue ?? []" :key="entry.id" class="queue-entry">
            <strong>#{{ entry.ticket_id }}</strong>
            <span>{{ entry.ticket_summary }}</span>
            <span class="meta">→ {{ entry.crew_name }} 第 {{ entry.position }} 位 · {{ entry.queued_by }}</span>
            <footer>
              <button type="button" class="btn primary" @click="store.dispatchQueue(entry.id)">叫号派工</button>
              <button type="button" class="btn ghost" @click="store.cancelQueue(entry.id)">取消</button>
            </footer>
          </article>
        </div>
        <div class="panel">
          <h2>备件库存</h2>
          <article v-for="part in store.data?.part_stock ?? []" :key="part.part_code" class="part-row">
            <span>{{ part.part_name }}</span>
            <span class="meta">{{ part.warehouse_name }}</span>
            <strong :class="{ shortage: part.stock === 0 }">{{ part.stock }}</strong>
          </article>
        </div>
      </div>
    </section>

    <section class="dispatch-grid bottom">
      <div class="panel">
        <h2>在修工单 / 改派</h2>
        <input v-model="reassignReason" class="text" placeholder="改派原因（可选），如：班组车辆故障" />
        <EmptyState v-if="store.activeTickets.length === 0" />
        <article v-for="ticket in store.activeTickets" :key="ticket.id" class="ticket-card">
          <header>
            <PriorityTag :value="ticket.priority" />
            <strong>#{{ ticket.id }}</strong>
            <StatusBadge :value="statusZh(ticket.status)" />
          </header>
          <p>{{ ticket.summary }}</p>
          <p class="meta">{{ crewName(ticket.team_id) }} 抢修中 · 派工人 {{ ticket.dispatcher_name || "—" }}</p>
          <footer>
            <button type="button" class="btn warn" @click="store.reassign(ticket.id, reassignReason)">改派（撤回重派）</button>
          </footer>
        </article>
      </div>

      <div class="panel">
        <h2>班组回传终端</h2>
        <label class="field">
          班组
          <select v-model.number="reportCrewId">
            <option v-for="crew in store.data?.crews ?? []" :key="crew.id" :value="crew.id">{{ crew.name }}</option>
          </select>
        </label>
        <div v-if="reportCrew" class="net-switch">
          <span class="dot" :class="store.isCrewOnline(reportCrew.id) ? 'on' : 'off'" />
          {{ store.isCrewOnline(reportCrew.id) ? "在线" : "断网（回传暂存本机）" }}
          <button
            type="button"
            class="btn"
            @click="store.setCrewOnline(reportCrew.id, !store.isCrewOnline(reportCrew.id))"
          >{{ store.isCrewOnline(reportCrew.id) ? "模拟断网" : "恢复网络并同步" }}</button>
          <span v-if="store.outboxCount(reportCrew.id)" class="outbox">待同步 {{ store.outboxCount(reportCrew.id) }} 条</span>
        </div>
        <template v-if="reportCrew">
          <label class="field">
            工单
            <select v-model.number="reportTicketId">
              <option :value="0" disabled>选择工单</option>
              <option v-for="t in reportCrewTickets" :key="t.id" :value="t.id">#{{ t.id }} {{ t.summary }}</option>
            </select>
          </label>
          <label class="field">
            回传类型
            <select v-model="reportType">
              <option v-for="t in CrewReportType" :key="t" :value="t">{{ CrewReportTypeText[t] }}</option>
            </select>
          </label>
          <label class="field">
            内容
            <input v-model="reportContent" class="text" placeholder="现场情况说明" />
          </label>
          <button type="button" class="btn primary" :disabled="!reportTicketId" @click="submitReport">发送回传</button>
          <div v-if="outboxOf(reportCrew.id).length" class="outbox-list">
            <p v-for="draft in outboxOf(reportCrew.id)" :key="draft.client_report_id" class="meta">
              暂存：工单#{{ draft.ticket_id }} · {{ CrewReportTypeText[draft.type] }} · {{ draft.content || "—" }}
            </p>
          </div>
          <p v-if="store.syncResult" class="sync-result">
            上次同步：合并 {{ store.syncResult.merged.length }} · 重复忽略 {{ store.syncResult.duplicated.length }} · 判废 {{ store.syncResult.invalidated.length }}
          </p>
        </template>
      </div>

      <div class="panel">
        <h2>待对账</h2>
        <input v-model="resolveNote" class="text" placeholder="核销说明（可选）" />
        <EmptyState v-if="store.pendingReconciliations.length === 0" />
        <article v-for="row in store.pendingReconciliations" :key="row.id" class="recon-row">
          <p><strong>#{{ row.id }}</strong> 工单#{{ row.ticket_id }} · {{ crewName(row.crew_id) }}</p>
          <p class="meta">{{ row.reason }}</p>
          <button type="button" class="btn" @click="store.resolveReconciliation(row.id, resolveNote)">核销</button>
        </article>
      </div>
    </section>

    <section class="dispatch-grid bottom two">
      <div class="panel">
        <h2>回传记录</h2>
        <TimelineList :items="reportTimeline" />
      </div>
      <div class="panel">
        <h2>操作日志</h2>
        <TimelineList :items="logTimeline" />
      </div>
    </section>
  </section>
</template>

<style scoped>
.dispatch { display: grid; gap: 18px; }
.toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.toolbar label { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.hint { color: #596257; font-size: 13px; }
.spacer { flex: 1; }
select, .text { padding: 8px 10px; border: 1px solid #c9d0c3; border-radius: 6px; background: #fff; font: inherit; }
.text { width: 100%; box-sizing: border-box; margin-bottom: 10px; }
.btn { border: 1px solid #274335; background: #274335; color: #f5f1e6; padding: 7px 14px; border-radius: 6px; cursor: pointer; text-align: center; }
.btn.ghost { background: transparent; color: #274335; }
.btn.primary { background: #7d4d18; border-color: #7d4d18; }
.btn.warn { background: #8c2f1b; border-color: #8c2f1b; }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.banner { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; }
.banner.error { background: #f7e3dd; border: 1px solid #d9a08f; color: #8c2f1b; }
.banner.ok { background: #e4efe4; border: 1px solid #a8c9ad; color: #244b31; }
.metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.dispatch-grid { display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 18px; align-items: start; }
.dispatch-grid.bottom { grid-template-columns: 1fr 1fr 1fr; }
.dispatch-grid.bottom.two { grid-template-columns: 1fr 1fr; }
.panel-stack { display: grid; gap: 18px; }
.panel h2 small { font-weight: 400; color: #596257; }
.ticket-card { border: 1px solid #d8d6c8; border-radius: 8px; padding: 12px; margin-bottom: 10px; cursor: pointer; background: #fff; }
.ticket-card.selected { outline: 2px solid #d39b46; }
.ticket-card header { display: flex; align-items: center; gap: 8px; }
.ticket-card p { margin: 8px 0 0; }
.meta { color: #596257; font-size: 13px; }
.hold-line { color: #8c2f1b; font-weight: 700; font-size: 13px; }
.hold-line.mine { color: #244b31; }
.queue-line { color: #7d4d18; font-size: 13px; font-weight: 700; }
.ticket-card footer, .queue-entry footer { display: flex; gap: 8px; margin-top: 10px; }
.queue-entry { border-top: 1px solid #e4e0d3; padding: 10px 0; display: grid; gap: 4px; }
.part-row { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; padding: 8px 0; border-top: 1px solid #e4e0d3; align-items: center; }
.shortage { color: #8c2f1b; }
.field { display: grid; gap: 6px; margin-bottom: 10px; font-weight: 700; }
.net-switch { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 14px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot.on { background: #2e7d32; }
.dot.off { background: #8c2f1b; }
.outbox { color: #7d4d18; font-weight: 700; }
.outbox-list { margin-top: 10px; border-top: 1px dashed #b8b09f; padding-top: 8px; }
.sync-result { margin-top: 10px; color: #244b31; font-weight: 700; }
.recon-row { border-top: 1px solid #e4e0d3; padding: 10px 0; }
.recon-row p { margin: 0 0 6px; }
@media (max-width: 1100px) { .dispatch-grid, .dispatch-grid.bottom, .dispatch-grid.bottom.two { grid-template-columns: 1fr; } }
</style>
