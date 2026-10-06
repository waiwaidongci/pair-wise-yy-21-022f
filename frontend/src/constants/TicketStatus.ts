export const TicketStatus = ["WAIT_DISPATCH","ASSIGNED","ARRIVED","REPAIRING","RESTORED","CLOSED"] as const;
export type TicketStatus = (typeof TicketStatus)[number];
export const TicketStatusText: Record<TicketStatus, string> = Object.fromEntries(TicketStatus.map((value) => [value, value.replace(/_/g, " ")])) as Record<TicketStatus, string>;
export const TicketStatusZh: Record<TicketStatus, string> = {
  WAIT_DISPATCH: "待派工",
  ASSIGNED: "已派工",
  ARRIVED: "已到场",
  REPAIRING: "处理中",
  RESTORED: "已复电",
  CLOSED: "已闭环"
};
