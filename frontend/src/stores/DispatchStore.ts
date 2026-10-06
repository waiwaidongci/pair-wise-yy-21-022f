import { defineStore } from "pinia";
import { dispatchApi } from "../api/Dispatch";
import type { ConfirmResult, DispatchConsole, Evaluation } from "../types/Dispatch";

interface State {
  console: DispatchConsole | null;
  loading: boolean;
  error: string | null;
  dispatcherId: number;
  evaluating: Record<string, Evaluation>;
  lastConfirm: ConfirmResult | null;
  lastAction: string | null;
}

export const useDispatchStore = defineStore("dispatch", {
  state: (): State => ({
    console: null,
    loading: false,
    error: null,
    dispatcherId: Number(localStorage.getItem("dispatcherId") ?? 1),
    evaluating: {},
    lastConfirm: null,
    lastAction: null
  }),

  getters: {
    crews: (s) => s.console?.crews ?? [],
    tickets: (s) => s.console?.tickets ?? [],
    queue: (s) => s.console?.queue ?? [],
    occupancies: (s) => s.console?.occupancies ?? [],
    reconciliations: (s) => s.console?.reconciliations ?? [],
    parts: (s) => s.console?.parts ?? [],
    unassignedTickets: (s) => s.console?.tickets.filter((t) => t.dispatchState === "UNASSIGNED") ?? [],
    queuedTickets: (s) => s.console?.tickets.filter((t) => t.dispatchState === "QUEUED") ?? [],
    occupiedTickets: (s) => s.console?.tickets.filter((t) => t.dispatchState === "OCCUPIED") ?? []
  },

  actions: {
    async load() {
      this.loading = true;
      this.error = null;
      try {
        this.console = await dispatchApi.getConsole();
      } catch (e) {
        this.error = (e as Error).message;
      } finally {
        this.loading = false;
      }
    },

    setDispatcher(id: number) {
      this.dispatcherId = id;
      localStorage.setItem("dispatcherId", String(id));
    },

    async evaluate(ticketId: number, crewId: number): Promise<Evaluation> {
      const key = `${ticketId}:${crewId}`;
      const result = await dispatchApi.evaluate(ticketId, crewId);
      this.evaluating[key] = result;
      return result;
    },

    evaluationFor(ticketId: number, crewId: number): Evaluation | undefined {
      return this.evaluating[`${ticketId}:${crewId}`];
    },

    async confirm(ticketId: number, crewId: number): Promise<ConfirmResult> {
      const result = await dispatchApi.confirm(ticketId, crewId);
      this.lastConfirm = result;
      this.lastAction = "confirm";
      await this.load();
      return result;
    },

    async reassign(ticketId: number, newCrewId: number): Promise<ConfirmResult> {
      const result = await dispatchApi.reassign(ticketId, newCrewId);
      this.lastConfirm = result;
      this.lastAction = "reassign";
      await this.load();
      return result;
    },

    async resolveReconciliation(id: number) {
      await dispatchApi.resolveReconciliation(id);
      await this.load();
    },

    clearLastConfirm() {
      this.lastConfirm = null;
      this.lastAction = null;
    }
  }
});
