import type { DispatchQueueEntry } from "../models/DispatchQueue";
import type { DispatchOccupancy } from "../models/DispatchOccupancy";
import type { CrewCallback } from "../models/CrewCallback";
import type { PendingReconciliation } from "../models/PendingReconciliation";

const now = (): string => new Date().toISOString();

export const dispatchDtoFactory = {
  queueEntry(overrides: Partial<DispatchQueueEntry> = {}): DispatchQueueEntry {
    return {
      id: 0,
      ticket_id: 0,
      crew_id: null,
      required_skills: "",
      reason: "",
      status: "WAITING",
      enqueued_by: 0,
      enqueued_at: now(),
      updated_at: now(),
      ...overrides
    };
  },

  occupancy(overrides: Partial<DispatchOccupancy> = {}): DispatchOccupancy {
    return {
      id: 0,
      ticket_id: 0,
      crew_id: 0,
      dispatcher_id: 0,
      status: "HELD",
      held_at: now(),
      confirmed_at: null,
      released_at: null,
      ...overrides
    };
  },

  callback(overrides: Partial<CrewCallback> = {}): CrewCallback {
    return {
      id: 0,
      ticket_id: 0,
      crew_id: 0,
      client_id: "",
      callback_type: "ARRIVED",
      payload: "{}",
      status: "ACTIVE",
      created_at: now(),
      synced_at: null,
      invalid_reason: null,
      ...overrides
    };
  },

  reconciliation(overrides: Partial<PendingReconciliation> = {}): PendingReconciliation {
    return {
      id: 0,
      callback_id: 0,
      ticket_id: 0,
      old_crew_id: 0,
      new_crew_id: null,
      reason: "",
      status: "PENDING",
      created_at: now(),
      resolved_at: null,
      resolved_by: null,
      ...overrides
    };
  }
};
