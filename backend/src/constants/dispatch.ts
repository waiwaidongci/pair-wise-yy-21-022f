export const DispatchQueueStatus = ["WAITING", "PROMOTED", "CANCELLED"] as const;
export type DispatchQueueStatus = (typeof DispatchQueueStatus)[number];

export const OccupancyStatus = ["HELD", "CONFIRMED", "RELEASED"] as const;
export type OccupancyStatus = (typeof OccupancyStatus)[number];

export const CallbackType = ["ARRIVED", "REPAIRING", "RESTORED"] as const;
export type CallbackType = (typeof CallbackType)[number];

export const CallbackStatus = ["ACTIVE", "INVALID", "SYNCED"] as const;
export type CallbackStatus = (typeof CallbackStatus)[number];

export const ReconciliationStatus = ["PENDING", "RESOLVED"] as const;
export type ReconciliationStatus = (typeof ReconciliationStatus)[number];

export const DispatchQueueStatusText: Record<DispatchQueueStatus, string> = {
  WAITING: "排队中",
  PROMOTED: "已派工",
  CANCELLED: "已取消"
};

export const OccupancyStatusText: Record<OccupancyStatus, string> = {
  HELD: "占用中",
  CONFIRMED: "已确认",
  RELEASED: "已释放"
};

export const CallbackTypeText: Record<CallbackType, string> = {
  ARRIVED: "到达现场",
  REPAIRING: "开始抢修",
  RESTORED: "复电完成"
};

export const CallbackStatusText: Record<CallbackStatus, string> = {
  ACTIVE: "有效",
  INVALID: "已失效",
  SYNCED: "已同步"
};

export const ReconciliationStatusText: Record<ReconciliationStatus, string> = {
  PENDING: "待对账",
  RESOLVED: "已对账"
};
