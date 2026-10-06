export const LOG_TEMPLATES = {
  GridAsset: ["GridAsset.create", "GridAsset.update", "GridAsset.status", "GridAsset.export"],
  FaultReport: ["FaultReport.create", "FaultReport.update", "FaultReport.status", "FaultReport.export"],
  RepairTicket: ["RepairTicket.create", "RepairTicket.update", "RepairTicket.status", "RepairTicket.export"],
  Crew: ["Crew.create", "Crew.update", "Crew.status", "Crew.export"],
  SparePartUsage: ["SparePartUsage.create", "SparePartUsage.update", "SparePartUsage.status", "SparePartUsage.export"],
  Dispatch: ["派工占用名额", "释放占用名额", "派工确认", "工单排队", "取消排队", "队列叫号派工", "工单改派", "占用过期释放"],
  CrewReport: ["回传合并", "回传判废", "重复回传忽略"],
  Reconciliation: ["待对账生成", "对账核销"]
};
