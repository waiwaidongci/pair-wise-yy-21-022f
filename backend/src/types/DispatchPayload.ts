import type { CrewReportType } from "../constants/CrewReportType";

export interface HoldPayload { ticket_id: number; dispatcher: string }
export interface ReleasePayload { ticket_id: number; dispatcher: string }
export interface ConfirmPayload { ticket_id: number; crew_id: number; dispatcher: string }
export interface EnqueuePayload { ticket_id: number; crew_id: number; dispatcher: string }
export interface QueueActionPayload { dispatcher: string }
export interface ReassignPayload { ticket_id: number; dispatcher: string; reason?: string }
export interface CrewReportPayload {
  client_report_id: string;
  ticket_id: number;
  crew_id: number;
  type: CrewReportType;
  content: string;
  reported_at: string;
}
export interface ReportSyncPayload { crew_id: number; reports: CrewReportPayload[] }
export interface ResolvePayload { resolver: string; note?: string }
