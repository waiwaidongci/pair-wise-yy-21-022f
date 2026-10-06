import type { CrewReportType } from "../constants/CrewReportType";
import type { CrewReportStatus } from "../constants/CrewReportStatus";

export interface CrewReport {
  client_report_id: string;
  ticket_id: number;
  crew_id: number;
  type: CrewReportType;
  content: string;
  reported_at: string;
  merged_at: string;
  status: CrewReportStatus;
}
