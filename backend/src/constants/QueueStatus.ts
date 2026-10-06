export const QueueStatus = ["WAITING", "DISPATCHED", "CANCELLED"] as const;
export type QueueStatus = (typeof QueueStatus)[number];
