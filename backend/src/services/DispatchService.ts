import { dispatchRepository } from "../repositories/DispatchRepository";
import { dispatchDtoFactory } from "../constructors/DispatchDtoFactory";
import { AppError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import type { Crew } from "../models/Crew";
import type { RepairTicket } from "../models/RepairTicket";
import type { PartStock } from "../models/PartStock";
import type { DispatchOccupancy } from "../models/DispatchOccupancy";
import type { DispatchQueueEntry } from "../models/DispatchQueue";
import type { CrewCallback } from "../models/CrewCallback";

const now = (): string => new Date().toISOString();

const ACTIVE_TICKET_STATUSES = ["ASSIGNED", "ARRIVED", "REPAIRING"];

function logDispatch(message: string, detail: Record<string, unknown>): void {
  console.info(`[dispatch] ${message}`, JSON.stringify(detail));
}

export interface CrewAvailability extends Crew {
  skills: string[];
  inHand: number;
  available: boolean;
}

export interface TicketDispatch extends RepairTicket {
  fault_type: string;
  address: string;
  requiredSkills: string[];
  queueEntry: DispatchQueueEntry | undefined;
  occupancy: DispatchOccupancy | undefined;
  dispatchState: "UNASSIGNED" | "QUEUED" | "OCCUPIED" | "DISPATCHED";
}

export interface Evaluation {
  canAccept: boolean;
  reasons: string[];
  missingSkills: string[];
  missingParts: PartStock[];
  inHand: number;
  capacity: number;
  requiredSkills: string[];
  requiredParts: PartStock[];
}

class DispatchService {
  private tickets(): RepairTicket[] {
    return dispatchRepository.tickets();
  }

  private crews(): Crew[] {
    return dispatchRepository.crews();
  }

  private faultTypeOf(ticket: RepairTicket): string {
    const fr = dispatchRepository.faultReports().find((f) => f.id === ticket.fault_report_id);
    return fr?.fault_type ?? "";
  }

  private requiredSkillsFor(faultType: string): string[] {
    return faultType ? [faultType] : [];
  }

  private requiredPartsFor(faultType: string): PartStock[] {
    return dispatchRepository.parts().filter((p) => p.applicable_fault_types.split(",").includes(faultType));
  }

  private inHandCount(crewId: number): number {
    const occupiedTicketIds = new Set(
      dispatchRepository.listOccupancies().filter((o) => o.status === "HELD").map((o) => o.ticket_id)
    );
    const fromOccupancy = dispatchRepository.countCrewOccupancies(crewId);
    const fromSeed = this.tickets().filter(
      (t) => t.team_id === crewId && ACTIVE_TICKET_STATUSES.includes(t.status) && !occupiedTicketIds.has(t.id)
    ).length;
    return fromOccupancy + fromSeed;
  }

  crewsWithAvailability(): CrewAvailability[] {
    return this.crews().map((c) => {
      const capacity = c.capacity ?? 3;
      const inHand = this.inHandCount(c.id);
      return {
        ...c,
        skills: c.skill_tags.split(",").map((s) => s.trim()).filter(Boolean),
        inHand,
        available: c.duty_status === "ON_DUTY" && inHand < capacity
      };
    });
  }

  ticketsWithDispatch(): TicketDispatch[] {
    const queueByTicket = new Map(
      dispatchRepository.listQueue().filter((q) => q.status === "WAITING").map((q) => [q.ticket_id, q])
    );
    const occByTicket = new Map(
      dispatchRepository.listOccupancies().filter((o) => o.status === "HELD").map((o) => [o.ticket_id, o])
    );
    return this.tickets().map((t) => {
      const fr = dispatchRepository.faultReports().find((f) => f.id === t.fault_report_id);
      const queueEntry = queueByTicket.get(t.id);
      const occupancy = occByTicket.get(t.id);
      let dispatchState: TicketDispatch["dispatchState"] = "UNASSIGNED";
      if (occupancy) dispatchState = "OCCUPIED";
      else if (queueEntry) dispatchState = "QUEUED";
      else if (t.status !== "WAIT_DISPATCH") dispatchState = "DISPATCHED";
      return {
        ...t,
        fault_type: fr?.fault_type ?? "",
        address: fr?.address_desc ?? "",
        requiredSkills: fr ? this.requiredSkillsFor(fr.fault_type) : [],
        queueEntry,
        occupancy,
        dispatchState
      };
    });
  }

  getConsole() {
    return {
      crews: this.crewsWithAvailability(),
      tickets: this.ticketsWithDispatch(),
      queue: dispatchRepository.listQueue().filter((q) => q.status === "WAITING"),
      occupancies: dispatchRepository.listOccupancies().filter((o) => o.status === "HELD"),
      reconciliations: dispatchRepository.listReconciliations().filter((r) => r.status === "PENDING"),
      parts: dispatchRepository.parts()
    };
  }

  evaluateCrew(ticketId: number, crewId: number): Evaluation {
    const ticket = this.tickets().find((t) => t.id === ticketId);
    if (!ticket) throw new AppError("工单不存在", ERROR_CODES.TICKET_NOT_DISPATCHABLE, 404);
    const crew = this.crews().find((c) => c.id === crewId);
    if (!crew) throw new AppError("班组不存在", ERROR_CODES.VALIDATION_FAILED, 404);

    const faultType = this.faultTypeOf(ticket);
    const requiredSkills = this.requiredSkillsFor(faultType);
    const requiredParts = this.requiredPartsFor(faultType);
    const crewSkills = crew.skill_tags.split(",").map((s) => s.trim()).filter(Boolean);
    const inHand = this.inHandCount(crewId);
    const capacity = crew.capacity ?? 3;

    const reasons: string[] = [];
    if (crew.duty_status !== "ON_DUTY") reasons.push("班组不在值班状态");
    const missingSkills = requiredSkills.filter((s) => !crewSkills.includes(s));
    if (missingSkills.length) reasons.push(`缺少技能：${missingSkills.join("、")}`);
    if (inHand >= capacity) reasons.push(`在手任务已满（${inHand}/${capacity}）`);
    const missingParts = requiredParts.filter((p) => p.stock <= 0);
    if (missingParts.length) reasons.push(`备件不足：${missingParts.map((p) => p.part_name).join("、")}`);

    return {
      canAccept: reasons.length === 0,
      reasons,
      missingSkills,
      missingParts,
      inHand,
      capacity,
      requiredSkills,
      requiredParts
    };
  }

  confirmDispatch(ticketId: number, crewId: number, dispatcherId: number) {
    const ticket = this.tickets().find((t) => t.id === ticketId);
    if (!ticket) throw new AppError("工单不存在", ERROR_CODES.TICKET_NOT_DISPATCHABLE, 404);

    // 并发控制：同一工单只放行一个占用，另一个看到占用者（先于状态判断，
    // 因为占用成功后工单状态已被置为 ASSIGNED）
    const existing = dispatchRepository.findActiveOccupancy(ticketId);
    if (existing) {
      const occupier = this.crewsWithAvailability().find((c) => c.id === existing.crew_id);
      logDispatch(LOG_TEMPLATES.Dispatch[1], { ticketId, crewId, dispatcherId, occupierId: existing.crew_id });
      return { status: "CONFLICT" as const, occupancy: existing, occupier };
    }

    if (ticket.status !== "WAIT_DISPATCH") {
      throw new AppError("当前工单状态不允许派工", ERROR_CODES.TICKET_NOT_DISPATCHABLE, 409);
    }

    const evaluation = this.evaluateCrew(ticketId, crewId);
    if (!evaluation.canAccept) {
      const queueEntry = dispatchRepository.insertQueue(
        dispatchDtoFactory.queueEntry({
          ticket_id: ticketId,
          crew_id: crewId,
          required_skills: evaluation.requiredSkills.join(","),
          reason: evaluation.reasons.join("；"),
          status: "WAITING",
          enqueued_by: dispatcherId,
          enqueued_at: now(),
          updated_at: now()
        })
      );
      logDispatch(LOG_TEMPLATES.Dispatch[2], { ticketId, crewId, dispatcherId, reason: evaluation.reasons.join("；") });
      return { status: "QUEUED" as const, queueEntry, evaluation };
    }

    const occupancy = dispatchRepository.insertOccupancy(
      dispatchDtoFactory.occupancy({
        ticket_id: ticketId,
        crew_id: crewId,
        dispatcher_id: dispatcherId,
        status: "HELD",
        held_at: now()
      })
    );
    ticket.team_id = crewId;
    ticket.dispatcher_id = dispatcherId;
    ticket.status = "ASSIGNED";
    ticket.assigned_at = now();

    const waiting = dispatchRepository.findWaitingQueueEntry(ticketId);
    if (waiting) dispatchRepository.updateQueue(waiting.id, { status: "PROMOTED", updated_at: now() });

    logDispatch(LOG_TEMPLATES.Dispatch[0], { ticketId, crewId, dispatcherId, occupancyId: occupancy.id });
    return { status: "OCCUPIED" as const, occupancy, evaluation };
  }

  reassign(ticketId: number, newCrewId: number, dispatcherId: number) {
    const ticket = this.tickets().find((t) => t.id === ticketId);
    if (!ticket) throw new AppError("工单不存在", ERROR_CODES.TICKET_NOT_DISPATCHABLE, 404);
    const oldCrewId = ticket.team_id;

    // 释放旧占用
    const oldOcc = dispatchRepository.findActiveOccupancy(ticketId);
    if (oldOcc) {
      dispatchRepository.updateOccupancy(oldOcc.id, { status: "RELEASED", released_at: now() });
    }

    // 旧班组回传失效并进入待对账
    const oldCallbacks = dispatchRepository
      .listCallbacksByTicket(ticketId)
      .filter((c) => c.crew_id === oldCrewId && c.status !== "INVALID");
    for (const cb of oldCallbacks) {
      dispatchRepository.updateCallback(cb.id, { status: "INVALID", invalid_reason: "工单改派，旧回传失效" });
      dispatchRepository.insertReconciliation(
        dispatchDtoFactory.reconciliation({
          callback_id: cb.id,
          ticket_id: ticketId,
          old_crew_id: oldCrewId,
          new_crew_id: newCrewId,
          reason: "工单改派，旧回传失效",
          status: "PENDING",
          created_at: now()
        })
      );
    }

    // 新班组能力判断
    const evaluation = this.evaluateCrew(ticketId, newCrewId);
    if (!evaluation.canAccept) {
      ticket.team_id = 0;
      ticket.status = "WAIT_DISPATCH";
      const queueEntry = dispatchRepository.insertQueue(
        dispatchDtoFactory.queueEntry({
          ticket_id: ticketId,
          crew_id: newCrewId,
          required_skills: evaluation.requiredSkills.join(","),
          reason: evaluation.reasons.join("；"),
          status: "WAITING",
          enqueued_by: dispatcherId,
          enqueued_at: now(),
          updated_at: now()
        })
      );
      logDispatch(LOG_TEMPLATES.Dispatch[4], { ticketId, oldCrewId, newCrewId, invalidated: oldCallbacks.length });
      return { status: "QUEUED" as const, queueEntry, evaluation, invalidated: oldCallbacks.length };
    }

    const occupancy = dispatchRepository.insertOccupancy(
      dispatchDtoFactory.occupancy({
        ticket_id: ticketId,
        crew_id: newCrewId,
        dispatcher_id: dispatcherId,
        status: "HELD",
        held_at: now()
      })
    );
    ticket.team_id = newCrewId;
    ticket.dispatcher_id = dispatcherId;
    ticket.status = "ASSIGNED";
    ticket.assigned_at = now();

    // 改派成功后，取消该工单仍在等待的排队记录
    for (const q of dispatchRepository.listQueue().filter((x) => x.ticket_id === ticketId && x.status === "WAITING")) {
      dispatchRepository.updateQueue(q.id, { status: "CANCELLED", updated_at: now() });
    }

    logDispatch(LOG_TEMPLATES.Dispatch[4], { ticketId, oldCrewId, newCrewId, invalidated: oldCallbacks.length });
    return { status: "REASSIGNED" as const, occupancy, evaluation, invalidated: oldCallbacks.length };
  }

  crewCallback(
    ticketId: number,
    crewId: number,
    callbackType: string,
    payload: unknown,
    clientId: string
  ): { status: "SYNCED" | "INVALID" | "DUPLICATE"; callback: CrewCallback } {
    const existing = dispatchRepository.findCallbackByClientId(clientId);
    if (existing) {
      return { status: "DUPLICATE", callback: existing };
    }

    const ticket = this.tickets().find((t) => t.id === ticketId);
    const currentCrewId = ticket?.team_id ?? 0;
    // 回传班组与工单当前班组不一致 → 工单已改派，回传失效
    const invalid = !!ticket && currentCrewId !== 0 && currentCrewId !== crewId;

    const callback = dispatchRepository.insertCallback(
      dispatchDtoFactory.callback({
        ticket_id: ticketId,
        crew_id: crewId,
        client_id: clientId,
        callback_type: callbackType,
        payload: JSON.stringify(payload ?? {}),
        status: invalid ? "INVALID" : "ACTIVE",
        created_at: now(),
        synced_at: now(),
        invalid_reason: invalid ? "工单已改派，回传失效" : null
      })
    );

    if (invalid) {
      dispatchRepository.insertReconciliation(
        dispatchDtoFactory.reconciliation({
          callback_id: callback.id,
          ticket_id: ticketId,
          old_crew_id: crewId,
          new_crew_id: currentCrewId,
          reason: "工单改派，旧回传失效",
          status: "PENDING",
          created_at: now()
        })
      );
      logDispatch(LOG_TEMPLATES.Dispatch[4], { ticketId, crewId, callbackType, clientId });
      return { status: "INVALID", callback };
    }

    logDispatch(LOG_TEMPLATES.Dispatch[5], { ticketId, crewId, callbackType, clientId });
    return { status: "SYNCED", callback };
  }

  syncCallbacks(
    crewId: number,
    callbacks: Array<{ ticket_id: number; crew_id?: number; callback_type: string; payload: unknown; client_id: string }>
  ) {
    const results = callbacks.map((c) =>
      this.crewCallback(c.ticket_id, c.crew_id ?? crewId, c.callback_type, c.payload, c.client_id)
    );
    const merged = results.filter((r) => r.status === "SYNCED").length;
    const invalid = results.filter((r) => r.status === "INVALID").length;
    const duplicates = results.filter((r) => r.status === "DUPLICATE").length;
    logDispatch(LOG_TEMPLATES.Dispatch[5], { crewId, total: callbacks.length, merged, invalid, duplicates });
    return { merged, invalid, duplicates, results };
  }

  resolveReconciliation(id: number, resolvedBy: number) {
    const rec = dispatchRepository.listReconciliations().find((r) => r.id === id);
    if (!rec) throw new AppError("待对账记录不存在", ERROR_CODES.RECONCILIATION_NOT_FOUND, 404);
    dispatchRepository.updateReconciliation(id, {
      status: "RESOLVED",
      resolved_at: now(),
      resolved_by: resolvedBy
    });
    logDispatch(LOG_TEMPLATES.Dispatch[7], { reconciliationId: id, resolvedBy });
    return { status: "RESOLVED" as const };
  }
}

export const dispatchService = new DispatchService();
