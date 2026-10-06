export const ReconciliationStatus = ["PENDING", "RESOLVED"] as const;
export type ReconciliationStatus = (typeof ReconciliationStatus)[number];
