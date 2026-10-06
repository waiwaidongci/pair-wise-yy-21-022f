<script setup lang="ts">
import { computed, ref } from "vue";
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { CallbackTypeText } from "../../constants/dispatch";
import type { TicketDispatch } from "../../types/Dispatch";

const props = defineProps<{
  crewId: number;
  tickets: TicketDispatch[];
}>();

const crewIdRef = computed(() => props.crewId);
const { online, pendingCount, pending, syncing, lastResult, enqueue, flush } = useOfflineSync(crewIdRef);

const selectedTicket = ref<number>(props.tickets[0]?.id ?? 0);
const callbackType = ref<string>("ARRIVED");
const submitMsg = ref<string>("");

const typeOptions = Object.entries(CallbackTypeText) as [string, string][];

async function submit() {
  if (!selectedTicket.value) return;
  submitMsg.value = "";
  enqueue({
    ticket_id: Number(selectedTicket.value),
    crew_id: props.crewId,
    callback_type: callbackType.value,
    payload: { source: "crew-console", at: new Date().toISOString() }
  });
  if (online.value) {
    const res = await flush();
    if (res) {
      const invalid = res.results.filter((r) => r.status === "INVALID").length;
      const dup = res.results.filter((r) => r.status === "DUPLICATE").length;
      submitMsg.value = invalid
        ? `已同步，但有 ${invalid} 条回传失效（转入待对账）`
        : dup
          ? `已去重 ${dup} 条重复回传`
          : "回传已同步";
    }
  } else {
    submitMsg.value = "当前离线，回传已保存，恢复网络后自动合并";
  }
}
</script>

<template>
  <div class="panel">
    <h2>
      班组回传
      <span class="net" :class="online ? 'net--on' : 'net--off'">{{ online ? "在线" : "离线" }}</span>
    </h2>
    <div class="offline-bar" v-if="pendingCount || !online">
      <template v-if="online">
        <span v-if="pendingCount">📥 有 {{ pendingCount }} 条回传待同步</span>
        <span v-else>✅ 所有回传已同步</span>
      </template>
      <template v-else>📴 离线模式：回传将保存在本机，恢复网络后自动合并（{{ pendingCount }} 条待发）</template>
    </div>

    <div class="form-row">
      <label>工单</label>
      <select v-model="selectedTicket">
        <option v-for="t in tickets" :key="t.id" :value="t.id">#{{ t.id }} {{ t.address }}</option>
      </select>
    </div>
    <div class="form-row">
      <label>环节</label>
      <select v-model="callbackType">
        <option v-for="[value, text] in typeOptions" :key="value" :value="value">{{ text }}</option>
      </select>
    </div>
    <button class="btn btn--primary" :disabled="!selectedTicket || syncing" @click="submit">
      {{ syncing ? "同步中…" : online ? "提交回传" : "离线保存回传" }}
    </button>
    <button v-if="online && pendingCount" class="btn btn--ghost" :disabled="syncing" @click="flush">立即同步</button>

    <div v-if="submitMsg" class="submit-msg">{{ submitMsg }}</div>

    <div v-if="lastResult" class="last-sync">
      最近同步：合并 {{ lastResult.merged }} · 失效 {{ lastResult.invalid }} · 去重 {{ lastResult.duplicates }}
    </div>
  </div>
</template>

<style scoped>
.panel { background: #fbfaf4; border: 1px solid #d8d6c8; border-radius: 8px; padding: 18px; display: grid; gap: 12px; align-content: start; }
h2 { margin: 0; font-size: 18px; display: flex; align-items: center; gap: 8px; }
.net { font-size: 12px; padding: 2px 10px; border-radius: 999px; font-weight: 700; }
.net--on { background: #e4efe4; color: #244b31; }
.net--off { background: #fde8e8; color: #9b1c1c; }
.offline-bar { font-size: 12px; padding: 8px 10px; border-radius: 6px; background: #f0e6d2; color: #7d4d18; }
.form-row { display: grid; gap: 4px; }
.form-row label { font-size: 12px; color: #596257; }
select { padding: 8px; border-radius: 6px; border: 1px solid #b8b09f; background: #fff; font-size: 13px; }
.btn { padding: 8px 12px; border-radius: 6px; border: 1px solid transparent; font-size: 13px; font-weight: 700; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: #274335; color: #f5f1e6; }
.btn--ghost { background: transparent; border-color: #b8b09f; color: #274335; }
.submit-msg { font-size: 13px; color: #244b31; background: #e4efe4; padding: 8px 10px; border-radius: 6px; }
.last-sync { font-size: 12px; color: #8a8f86; }
</style>
