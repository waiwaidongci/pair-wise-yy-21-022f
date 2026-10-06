import { config } from "../config/env";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { createCrewView, createLogEntry, createQueueEntryView, inHandTicketIds } from "../constructors/DispatchStateFactory";
import type { Crew } from "../models/Crew";
import type { DispatchState } from "../models/DispatchState";
import type { RepairTicket } from "../models/RepairTicket";
import type { CrewReportPayload } from "../types/DispatchPayload";
import { AppError } from "../utils/AppError";

const ACTIVE_STATUS = ["ASSIGNED", "ARRIVED", "REPAIRING"];
const STATUS_RANK: Record<string, number> = { WAIT_DISPATCH: 0, ASSIGNED: 1, ARRIVED: 2, REPAIRING: 3, RESTORED: 4, CLOSED: 5 };
const REPORT_TARGET_STATUS: Record<string, string> = { ARRIVED: "ARRIVED", REPAIRING: "REPAIRING", RESTORED: "RESTORED" };

export interface EligibilityReason { code: string; message: string }

const nowIso = () => new Date().toISOString();

const pushLog = (state: DispatchState, template: string, actor: string, detail: string): void => {
  state.logs.unshift(createLogEntry(template, actor, detail));
  if (state.logs.length > 200) state.logs.length = 200;
};

const findTicket = (state: DispatchState, ticketId: number): RepairTicket => {
  const ticket = state.tickets.find((t) => t.id === ticketId);
  if (!ticket) throw new AppError(ERROR_CODES.TICKET_NOT_FOUND, `${ERROR_MESSAGES.TICKET_NOT_FOUND} #${ticketId}`, 404);
  return ticket;
};

const findCrew = (state: DispatchState, crewId: number): Crew => {
  const crew = state.crews.find((c) => c.id === crewId);
  if (!crew) throw new AppError(ERROR_CODES.CREW_NOT_FOUND, `${ERROR_MESSAGES.CREW_NOT_FOUND} #${crewId}`, 404);
  return crew;
};

const activeHold = (state: DispatchState, ticketId: number) => {
  const hold = state.holds.find((h) => h.ticket_id === ticketId);
  return hold && hold.expires_at > nowIso() ? hold : undefined;
};

const pruneHolds = (state: DispatchState): void => {
  const now = nowIso();
  const expired = state.holds.filter((h) => h.expires_at <= now);
  for (const hold of expired) {
    pushLog(state, LOG_TEMPLATES.Dispatch[7], "system", `工单#${hold.ticket_id} 占用者 ${hold.dispatcher} 超时未确认`);
  }
  state.holds = state.holds.filter((h) => h.expires_at > now);
};

const heldByOther = (state: DispatchState, ticketId: number, dispatcher: string): void => {
  const hold = activeHold(state, ticketId);
  if (hold && hold.dispatcher !== dispatcher) {
    throw new AppError(ERROR_CODES.TICKET_HELD, `${ERROR_MESSAGES.TICKET_HELD}：${hold.dispatcher}`, 409, {
      holder: hold.dispatcher,
      expires_at: hold.expires_at
    });
  }
};

const assertHoldable = (state: DispatchState, ticket: RepairTicket): void => {
  if (ticket.status !== "WAIT_DISPATCH") {
    throw new AppError(
      ERROR_CODES.TICKET_NOT_HOLDABLE,
      `${ERROR_MESSAGES.TICKET_NOT_HOLDABLE}（当前 ${ticket.status}${ticket.dispatcher_name ? `，已由 ${ticket.dispatcher_name} 派出` : ""}）`,
      409,
      { status: ticket.status, holder: ticket.dispatcher_name }
    );
  }
};

/** 接单判断：技能、在手任务、备件、值班状态。确认派工与前端展示共用同一套规则。 */
export const evaluateCrew = (state: DispatchState, ticket: RepairTicket, crew: Crew): EligibilityReason[] => {
  const reasons: EligibilityReason[] = [];
  if (crew.duty_status !== "ON_DUTY") {
    reasons.push({ code: ERROR_CODES.CREW_OFF_DUTY, message: ERROR_MESSAGES.CREW_OFF_DUTY });
  }
  const skills = crew.skill_tags.split(",").map((s) => s.trim());
  if (ticket.required_skill && !skills.includes(ticket.required_skill)) {
    reasons.push({ code: ERROR_CODES.SKILL_MISMATCH, message: `${ERROR_MESSAGES.SKILL_MISMATCH}：需「${ticket.required_skill}」` });
  }
  const inHand = inHandTicketIds(state.tickets, crew.id).length;
  if (inHand >= crew.max_tasks) {
    reasons.push({ code: ERROR_CODES.CREW_CAPACITY_FULL, message: `${ERROR_MESSAGES.CREW_CAPACITY_FULL}（${inHand}/${crew.max_tasks}）` });
  }
  if (ticket.required_part_code) {
    const part = state.partStock.find((p) => p.part_code === ticket.required_part_code);
    const available = part?.stock ?? 0;
    if (available < ticket.required_part_qty) {
      reasons.push({
        code: ERROR_CODES.PART_SHORTAGE,
        message: `${ERROR_MESSAGES.PART_SHORTAGE}：${part?.part_name ?? ticket.required_part_code} 需${ticket.required_part_qty} 余${available}`
      });
    }
  }
  return reasons;
};

const firstReasonError = (reasons: EligibilityReason[]): AppError =>
  new AppError(reasons[0].code, reasons[0].message, 409, { reasons });

/** 派工落地：占用名额消费、工单指派、备件出库、同单排队作废。 */
const applyAssignment = (state: DispatchState, ticket: RepairTicket, crew: Crew, dispatcher: string): void => {
  ticket.status = "ASSIGNED";
  ticket.team_id = crew.id;
  ticket.dispatcher_name = dispatcher;
  ticket.assigned_at = nowIso();
  crew.current_ticket_id = ticket.id;
  state.holds = state.holds.filter((h) => h.ticket_id !== ticket.id);
  if (ticket.required_part_code) {
    const part = state.partStock.find((p) => p.part_code === ticket.required_part_code);
    if (part) part.stock -= ticket.required_part_qty;
    state.sparePartUsage.push({
      id: state.seq.usage++,
      ticket_id: ticket.id,
      part_code: ticket.required_part_code,
      part_name: part?.part_name ?? ticket.required_part_code,
      quantity: ticket.required_part_qty,
      warehouse_name: part?.warehouse_name ?? "",
      approved_by: dispatcher,
      usage_status: "OUT"
    });
  }
  for (const entry of state.queue.filter((q) => q.ticket_id === ticket.id && q.status === "WAITING")) {
    entry.status = "CANCELLED";
  }
};

const takeHold = (state: DispatchState, ticket: RepairTicket, dispatcher: string): void => {
  const expires = new Date(Date.now() + config.dispatchHoldTtlMs).toISOString();
  const existing = state.holds.find((h) => h.ticket_id === ticket.id);
  if (existing) {
    existing.dispatcher = dispatcher;
    existing.acquired_at = nowIso();
    existing.expires_at = expires;
  } else {
    state.holds.push({ ticket_id: ticket.id, dispatcher, acquired_at: nowIso(), expires_at: expires });
  }
};

export const dispatchService = {
  buildStateResponse(state: DispatchState) {
    pruneHolds(state);
    const eligibility: Record<number, Record<number, { ok: boolean; reasons: EligibilityReason[] }>> = {};
    for (const ticket of state.tickets.filter((t) => t.status === "WAIT_DISPATCH")) {
      eligibility[ticket.id] = {};
      for (const crew of state.crews) {
        const reasons = evaluateCrew(state, ticket, crew);
        eligibility[ticket.id][crew.id] = { ok: reasons.length === 0, reasons };
      }
    }
    return {
      now: nowIso(),
      hold_ttl_ms: config.dispatchHoldTtlMs,
      tickets: [...state.tickets].sort((a, b) => a.id - b.id),
      crews: state.crews.map((c) => createCrewView(c, state.tickets)),
      part_stock: state.partStock,
      spare_part_usage: [...state.sparePartUsage].reverse(),
      holds: state.holds,
      queue: state.queue.filter((q) => q.status === "WAITING").map((q) => createQueueEntryView(q, state)),
      reports: [...state.reports].reverse(),
      reconciliations: [...state.reconciliations].reverse(),
      eligibility,
      logs: state.logs.slice(0, 50)
    };
  },

  hold(state: DispatchState, ticketId: number, dispatcher: string) {
    pruneHolds(state);
    const ticket = findTicket(state, ticketId);
    assertHoldable(state, ticket);
    heldByOther(state, ticketId, dispatcher);
    takeHold(state, ticket, dispatcher);
    pushLog(state, LOG_TEMPLATES.Dispatch[0], dispatcher, `工单#${ticket.id} ${ticket.summary}`);
    return activeHold(state, ticketId);
  },

  release(state: DispatchState, ticketId: number, dispatcher: string) {
    pruneHolds(state);
    findTicket(state, ticketId);
    heldByOther(state, ticketId, dispatcher);
    state.holds = state.holds.filter((h) => h.ticket_id !== ticketId);
    pushLog(state, LOG_TEMPLATES.Dispatch[1], dispatcher, `工单#${ticketId}`);
    return { released: true };
  },

  confirm(state: DispatchState, ticketId: number, crewId: number, dispatcher: string) {
    pruneHolds(state);
    const ticket = findTicket(state, ticketId);
    const crew = findCrew(state, crewId);
    assertHoldable(state, ticket);
    heldByOther(state, ticketId, dispatcher);
    const reasons = evaluateCrew(state, ticket, crew);
    if (reasons.length > 0) throw firstReasonError(reasons);
    takeHold(state, ticket, dispatcher);
    applyAssignment(state, ticket, crew, dispatcher);
    pushLog(state, LOG_TEMPLATES.Dispatch[2], dispatcher, `工单#${ticket.id} → ${crew.name}`);
    return { ticket, crew: createCrewView(crew, state.tickets) };
  },

  enqueue(state: DispatchState, ticketId: number, crewId: number, dispatcher: string) {
    pruneHolds(state);
    const ticket = findTicket(state, ticketId);
    const crew = findCrew(state, crewId);
    assertHoldable(state, ticket);
    heldByOther(state, ticketId, dispatcher);
    const waiting = state.queue.find((q) => q.ticket_id === ticketId && q.status === "WAITING");
    if (waiting) {
      throw new AppError(ERROR_CODES.ALREADY_QUEUED, `${ERROR_MESSAGES.ALREADY_QUEUED}（${waiting.queued_by} 排入 ${findCrew(state, waiting.crew_id).name}）`, 409, {
        queued_by: waiting.queued_by,
        crew_id: waiting.crew_id
      });
    }
    const blocking = evaluateCrew(state, ticket, crew).filter((r) =>
      [ERROR_CODES.CREW_OFF_DUTY, ERROR_CODES.SKILL_MISMATCH].includes(r.code as never)
    );
    if (blocking.length > 0) throw firstReasonError(blocking);
    const entry = { id: state.seq.queue++, ticket_id: ticketId, crew_id: crewId, queued_by: dispatcher, queued_at: nowIso(), status: "WAITING" as const };
    state.queue.push(entry);
    pushLog(state, LOG_TEMPLATES.Dispatch[3], dispatcher, `工单#${ticketId} → ${crew.name}（容量不足先排队）`);
    return createQueueEntryView(entry, state);
  },

  cancelQueue(state: DispatchState, entryId: number, dispatcher: string) {
    const entry = state.queue.find((q) => q.id === entryId && q.status === "WAITING");
    if (!entry) throw new AppError(ERROR_CODES.QUEUE_ENTRY_NOT_FOUND, ERROR_MESSAGES.QUEUE_ENTRY_NOT_FOUND, 404);
    entry.status = "CANCELLED";
    pushLog(state, LOG_TEMPLATES.Dispatch[4], dispatcher, `工单#${entry.ticket_id} 移出 ${findCrew(state, entry.crew_id).name} 队列`);
    return { cancelled: true };
  },

  dispatchFromQueue(state: DispatchState, entryId: number, dispatcher: string) {
    pruneHolds(state);
    const entry = state.queue.find((q) => q.id === entryId && q.status === "WAITING");
    if (!entry) throw new AppError(ERROR_CODES.QUEUE_ENTRY_NOT_FOUND, ERROR_MESSAGES.QUEUE_ENTRY_NOT_FOUND, 404);
    const ticket = findTicket(state, entry.ticket_id);
    const crew = findCrew(state, entry.crew_id);
    assertHoldable(state, ticket);
    heldByOther(state, ticket.id, dispatcher);
    const reasons = evaluateCrew(state, ticket, crew);
    if (reasons.length > 0) throw firstReasonError(reasons);
    takeHold(state, ticket, dispatcher);
    applyAssignment(state, ticket, crew, dispatcher);
    entry.status = "DISPATCHED";
    pushLog(state, LOG_TEMPLATES.Dispatch[5], dispatcher, `工单#${ticket.id} → ${crew.name}`);
    return { ticket, entry };
  },

  /** 改派：工单回池，旧班组回传判废进待对账，备件退回库存。 */
  reassign(state: DispatchState, ticketId: number, dispatcher: string, reason?: string) {
    pruneHolds(state);
    const ticket = findTicket(state, ticketId);
    if (!ACTIVE_STATUS.includes(ticket.status)) {
      throw new AppError(ERROR_CODES.TICKET_NOT_ACTIVE, `${ERROR_MESSAGES.TICKET_NOT_ACTIVE}（当前 ${ticket.status}）`, 409, { status: ticket.status });
    }
    const oldCrew = findCrew(state, ticket.team_id);
    let invalidated = 0;
    for (const report of state.reports.filter((r) => r.ticket_id === ticket.id && r.status === "MERGED")) {
      report.status = "INVALID";
      invalidated += 1;
      state.reconciliations.push({
        id: state.seq.reconciliation++,
        report_client_id: report.client_report_id,
        ticket_id: ticket.id,
        crew_id: report.crew_id,
        reason: `工单改派（${oldCrew.name}），原回传失效${reason ? `：${reason}` : ""}`,
        status: "PENDING",
        created_at: nowIso(),
        resolved_at: "",
        resolved_by: ""
      });
      pushLog(state, LOG_TEMPLATES.CrewReport[1], dispatcher, `回传 ${report.client_report_id}（工单#${ticket.id}）`);
      pushLog(state, LOG_TEMPLATES.Reconciliation[0], dispatcher, `工单#${ticket.id} 回传 ${report.client_report_id}`);
    }
    for (const usage of state.sparePartUsage.filter((u) => u.ticket_id === ticket.id && u.usage_status === "OUT")) {
      usage.usage_status = "RETURNED";
      const part = state.partStock.find((p) => p.part_code === usage.part_code);
      if (part) part.stock += usage.quantity;
    }
    for (const entry of state.queue.filter((q) => q.ticket_id === ticket.id && q.status === "WAITING")) {
      entry.status = "CANCELLED";
    }
    state.holds = state.holds.filter((h) => h.ticket_id !== ticket.id);
    ticket.status = "WAIT_DISPATCH";
    ticket.team_id = 0;
    ticket.dispatcher_id = 0;
    ticket.dispatcher_name = "";
    ticket.assigned_at = "";
    pushLog(state, LOG_TEMPLATES.Dispatch[6], dispatcher, `工单#${ticket.id} 自 ${oldCrew.name} 撤回，判废回传 ${invalidated} 条`);
    return { ticket, invalidated };
  },

  /** 班组回传批量合并：按 client_report_id 幂等，迟到回传（已改派/已办结）判废进待对账。 */
  syncReports(state: DispatchState, reports: CrewReportPayload[]) {
    const result = { merged: [] as string[], duplicated: [] as string[], invalidated: [] as string[] };
    for (const payload of reports) {
      if (state.reports.some((r) => r.client_report_id === payload.client_report_id)) {
        result.duplicated.push(payload.client_report_id);
        pushLog(state, LOG_TEMPLATES.CrewReport[2], "system", `回传 ${payload.client_report_id}`);
        continue;
      }
      const ticket = state.tickets.find((t) => t.id === payload.ticket_id);
      const valid = ticket && ticket.team_id === payload.crew_id && ACTIVE_STATUS.includes(ticket.status);
      const report = {
        ...payload,
        merged_at: nowIso(),
        status: (valid ? "MERGED" : "INVALID") as "MERGED" | "INVALID"
      };
      state.reports.push(report);
      if (!valid || !ticket) {
        result.invalidated.push(payload.client_report_id);
        state.reconciliations.push({
          id: state.seq.reconciliation++,
          report_client_id: payload.client_report_id,
          ticket_id: payload.ticket_id,
          crew_id: payload.crew_id,
          reason: `回传到达时工单#${payload.ticket_id} 已改派或已办结`,
          status: "PENDING",
          created_at: nowIso(),
          resolved_at: "",
          resolved_by: ""
        });
        pushLog(state, LOG_TEMPLATES.CrewReport[1], "system", `回传 ${payload.client_report_id}（工单#${payload.ticket_id}）`);
        pushLog(state, LOG_TEMPLATES.Reconciliation[0], "system", `工单#${payload.ticket_id} 回传 ${payload.client_report_id}`);
        continue;
      }
      result.merged.push(payload.client_report_id);
      const target = REPORT_TARGET_STATUS[payload.type];
      if (target && STATUS_RANK[target] > STATUS_RANK[ticket.status]) {
        ticket.status = target;
        if (target === "RESTORED") {
          ticket.restored_at = nowIso();
          for (const usage of state.sparePartUsage.filter((u) => u.ticket_id === ticket.id && u.usage_status === "OUT")) {
            usage.usage_status = "CONSUMED";
          }
        }
      }
      pushLog(state, LOG_TEMPLATES.CrewReport[0], findCrew(state, payload.crew_id).name, `工单#${ticket.id} ${payload.type}：${payload.content || "—"}`);
    }
    return result;
  },

  resolveReconciliation(state: DispatchState, id: number, resolver: string, note?: string) {
    const row = state.reconciliations.find((r) => r.id === id && r.status === "PENDING");
    if (!row) throw new AppError(ERROR_CODES.RECONCILIATION_NOT_FOUND, ERROR_MESSAGES.RECONCILIATION_NOT_FOUND, 404);
    row.status = "RESOLVED";
    row.resolved_at = nowIso();
    row.resolved_by = resolver;
    if (note) row.reason += `；核销说明：${note}`;
    pushLog(state, LOG_TEMPLATES.Reconciliation[1], resolver, `待对账#${id}（工单#${row.ticket_id}）`);
    return row;
  }
};
