export const CrewReportType = ["ARRIVED", "REPAIRING", "RESTORED", "NOTE"] as const;
export type CrewReportType = (typeof CrewReportType)[number];
