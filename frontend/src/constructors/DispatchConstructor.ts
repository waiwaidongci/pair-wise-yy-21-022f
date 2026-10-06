import type { CrewReportType } from "../constants/CrewReportType";
import type { CrewReportDraft, SyncResult } from "../types/Dispatch";

const uuid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `r-${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** 班组回传草稿：client_report_id 在生成时确定，断网暂存与恢复合并共用同一 id，保证幂等。 */
export const createCrewReportDraft = (crewId: number, ticketId: number, type: CrewReportType, content: string): CrewReportDraft => ({
  client_report_id: uuid(),
  ticket_id: ticketId,
  crew_id: crewId,
  type,
  content,
  reported_at: new Date().toISOString()
});

export const createEmptySyncResult = (): SyncResult => ({ merged: [], duplicated: [], invalidated: [] });
