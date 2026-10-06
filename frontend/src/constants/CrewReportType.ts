export const CrewReportType = ["ARRIVED", "REPAIRING", "RESTORED", "NOTE"] as const;
export type CrewReportType = (typeof CrewReportType)[number];
export const CrewReportTypeText: Record<CrewReportType, string> = { ARRIVED: "已到场", REPAIRING: "处理中", RESTORED: "已复电", NOTE: "备注" };
