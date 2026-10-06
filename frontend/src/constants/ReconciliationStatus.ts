export const ReconciliationStatus = ["PENDING", "RESOLVED"] as const;
export type ReconciliationStatus = (typeof ReconciliationStatus)[number];
export const ReconciliationStatusText: Record<ReconciliationStatus, string> = { PENDING: "待对账", RESOLVED: "已核销" };
