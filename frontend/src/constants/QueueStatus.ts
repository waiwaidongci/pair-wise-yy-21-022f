export const QueueStatus = ["WAITING", "DISPATCHED", "CANCELLED"] as const;
export type QueueStatus = (typeof QueueStatus)[number];
export const QueueStatusText: Record<QueueStatus, string> = { WAITING: "排队中", DISPATCHED: "已叫号", CANCELLED: "已取消" };
