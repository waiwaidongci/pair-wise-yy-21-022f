import { computed, onMounted, onUnmounted, ref, type Ref } from "vue";
import { dispatchApi, type SyncCallbackInput } from "../api/Dispatch";
import type { PendingCallback, SyncResponse } from "../types/Dispatch";

const OFFLINE_QUEUE_KEY = "offlineCallbackQueue";

function loadQueue(): PendingCallback[] {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) ?? "[]") as PendingCallback[];
  } catch {
    return [];
  }
}

export function useOfflineSync(crewId: Ref<number>) {
  const online = ref<boolean>(navigator.onLine);
  const pending = ref<PendingCallback[]>(loadQueue());
  const syncing = ref(false);
  const lastSync = ref<string | null>(null);
  const lastResult = ref<SyncResponse | null>(null);

  const pendingCount = computed(() => pending.value.length);

  function persist() {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(pending.value));
  }

  function enqueue(cb: Omit<PendingCallback, "client_id" | "created_at">) {
    pending.value.push({
      ...cb,
      client_id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `cb-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      created_at: new Date().toISOString()
    });
    persist();
  }

  async function flush(): Promise<SyncResponse | null> {
    if (!online.value || pending.value.length === 0 || syncing.value) return null;
    syncing.value = true;
    try {
      const batch: SyncCallbackInput[] = pending.value.map((p) => ({
        ticket_id: p.ticket_id,
        crew_id: p.crew_id,
        callback_type: p.callback_type,
        payload: p.payload,
        client_id: p.client_id
      }));
      const res = await dispatchApi.sync(crewId.value, batch);
      const done = new Set(res.results.map((r) => r.callback.client_id));
      pending.value = pending.value.filter((p) => !done.has(p.client_id));
      persist();
      lastSync.value = new Date().toLocaleTimeString("zh-CN");
      lastResult.value = res;
      return res;
    } catch {
      return null;
    } finally {
      syncing.value = false;
    }
  }

  function onOnline() {
    online.value = true;
    void flush();
  }
  function onOffline() {
    online.value = false;
  }

  onMounted(() => {
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    if (online.value) void flush();
  });
  onUnmounted(() => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  });

  return { online, pending, syncing, lastSync, lastResult, pendingCount, enqueue, flush };
}
