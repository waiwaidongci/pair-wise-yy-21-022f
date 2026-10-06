export const CrewReportStatus = ["MERGED", "INVALID"] as const;
export type CrewReportStatus = (typeof CrewReportStatus)[number];
