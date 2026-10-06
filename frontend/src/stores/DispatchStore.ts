import { defineStore } from "pinia";
import {
  fetchDispatchState,
  postCancelQueue,
  postConfirm,
  postDispatchQueue,
  postEnqueue,
  postHold,
  postReassign,
  postRelease,
  postReset,
  postResolveReconciliation,
  postSyncReports,
  ApiError
} from "../api/Dispatch";
import { createCrewReportDraft } from "../constructors/DispatchConstructor";
import type { CrewReportType } from "../constants/CrewReportType";
import type { CrewReportDraft, DispatchStateResponse, SyncResult } from "../types/Dispatch";

const LS_DISPATCHER = "grid-repair.dispatcher";
const LS_CREW_ONLINE = "grid-repair.crew-online";
const LS_OUTBOX = "grid-repair.report-outbox";

const readLs = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeLs = (key: string, value: unknown): void => localStorage.setItem(key, JSON.stringify(value));

interface DispatchStoreState {
  data: DispatchStateResponse | null;
  loading: boolean;
  error: { code: string; message: string } | null;
  notice: string;
  selectedTicketId: number;
  dispatcher: string;
  crewOnline: Record<number, boolean>;
  outbox: Record<number, CrewReportDraft[]>;
  syncResult: SyncResult | null;
}

export const useDispatchStore = defineStore("dispatch", {
  state: (): DispatchStoreState => ({
    data: null,
    loading: false,
    error: null,
    notice: "",
    selectedTicketId: 0,
    dispatcher: readLs<string>(LS_DISPATCHER, "张伟"),
    crewOnline: readLs<Record<number, boolean>>(LS_CREW_ONLINE, {}),
    outbox: readLs<Record<number, CrewReportDraft[]>>(LS_OUTBOX, {}),
    syncResult: null
  }),
  getters: {
    waitingTickets: (s) => s.data?.tickets.filter((t) => t.status === "WAIT_DISPATCH") ?? [],
    activeTickets: (s) => s.data?.tickets.filter((t) => ["ASSIGNED", "ARRIVED", "REPAIRING"].includes(t.status)) ?? [],
    pendingReconciliations: (s) => s.data?.reconciliations.filter((r) => r.status === "PENDING") ?? [],
    holdOf: (s) => (ticketId: number) => s.data?.holds.find((h) => h.ticket_id === ticketId),
    queueOf: (s) => (ticketId: number) => s.data?.queue.find((q) => q.ticket_id === ticketId),
    outboxCount: (s) => (crewId: number) => s.outbox[crewId]?.length ?? 0,
    isCrewOnline: (s) => (crewId: number) => s.crewOnline[crewId] !== false
  },
  actions: {
    async refresh() {
      this.loading = true;
      try {
        this.data = await fetchDispatchState();
      } catch (err) {
        this.error = err instanceof ApiError ? { code: err.code, message: err.message } : { code: "INTERNAL_ERROR", message: String(err) };
      } finally {
        this.loading = false;
      }
    },
    /** 所有写动作统一入口：捕获业务错误展示，随后刷新状态让占用/队列/对账即时可见。 */
    async run(action: () => Promise<unknown>, okMessage = "") {
      this.error = null;
      this.notice = "";
      try {
        await action();
        if (okMessage) this.notice = okMessage;
      } catch (err) {
        if (err instanceof ApiError) {
          const holder = err.details.holder ? `（占用者：${String(err.details.holder)}）` : "";
          this.error = { code: err.code, message: `${err.message}${holder}` };
        } else {
          this.error = { code: "INTERNAL_ERROR", message: String(err) };
        }
      } finally {
        await this.refresh();
      }
    },
    selectTicket(id: number) {
      this.selectedTicketId = id;
    },
    setDispatcher(name: string) {
      this.dispatcher = name;
      writeLs(LS_DISPATCHER, name);
    },
    hold(ticketId: number) {
      return this.run(() => postHold(ticketId, this.dispatcher), `工单#${ticketId} 已占用`);
    },
    release(ticketId: number) {
      return this.run(() => postRelease(ticketId, this.dispatcher), `工单#${ticketId} 占用已释放`);
    },
    confirm(ticketId: number, crewId: number) {
      return this.run(() => postConfirm(ticketId, crewId, this.dispatcher), `工单#${ticketId} 派工成功`);
    },
    enqueue(ticketId: number, crewId: number) {
      return this.run(() => postEnqueue(ticketId, crewId, this.dispatcher), `工单#${ticketId} 已排队`);
    },
    cancelQueue(entryId: number) {
      return this.run(() => postCancelQueue(entryId, this.dispatcher), "已取消排队");
    },
    dispatchQueue(entryId: number) {
      return this.run(() => postDispatchQueue(entryId, this.dispatcher), "叫号派工成功");
    },
    reassign(ticketId: number, reason: string) {
      return this.run(() => postReassign(ticketId, this.dispatcher, reason), `工单#${ticketId} 已改派，旧回传进入待对账`);
    },
    resolveReconciliation(id: number, note: string) {
      return this.run(() => postResolveReconciliation(id, this.dispatcher, note), `待对账#${id} 已核销`);
    },
    reset() {
      return this.run(async () => {
        this.data = await postReset();
        this.outbox = {};
        writeLs(LS_OUTBOX, this.outbox);
        this.syncResult = null;
      }, "演示数据已重置");
    },
    /** 班组断网开关：恢复在线时自动把暂存回传合并到调度台。 */
    async setCrewOnline(crewId: number, online: boolean) {
      this.crewOnline = { ...this.crewOnline, [crewId]: online };
      writeLs(LS_CREW_ONLINE, this.crewOnline);
      if (online) await this.flushOutbox(crewId);
    },
    async submitReport(crewId: number, ticketId: number, type: CrewReportType, content: string) {
      const draft = createCrewReportDraft(crewId, ticketId, type, content);
      if (this.isCrewOnline(crewId)) {
        await this.run(async () => {
          this.syncResult = await postSyncReports(crewId, [draft]);
        }, "回传已合并");
      } else {
        this.outbox = { ...this.outbox, [crewId]: [...(this.outbox[crewId] ?? []), draft] };
        writeLs(LS_OUTBOX, this.outbox);
        this.notice = `已断网，回传暂存本机（待同步 ${this.outbox[crewId].length} 条）`;
        this.error = null;
      }
    },
    async flushOutbox(crewId: number) {
      const pending = this.outbox[crewId] ?? [];
      if (pending.length === 0) return;
      await this.run(async () => {
        const result = await postSyncReports(crewId, pending);
        this.syncResult = result;
        const done = new Set([...result.merged, ...result.duplicated, ...result.invalidated]);
        this.outbox = { ...this.outbox, [crewId]: pending.filter((r) => !done.has(r.client_report_id)) };
        writeLs(LS_OUTBOX, this.outbox);
      }, `网络恢复：合并 ${this.syncResult?.merged.length ?? 0} 条，判废 ${this.syncResult?.invalidated.length ?? 0} 条`);
    },
    dismissError() {
      this.error = null;
    },
    dismissNotice() {
      this.notice = "";
    }
  }
});
