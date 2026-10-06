export const LOG_TEMPLATES = {
  GridAsset: ["GridAsset.create", "GridAsset.update", "GridAsset.status", "GridAsset.export"],
  FaultReport: ["FaultReport.create", "FaultReport.update", "FaultReport.status", "FaultReport.export"],
  RepairTicket: ["RepairTicket.create", "RepairTicket.update", "RepairTicket.status", "RepairTicket.export"],
  Crew: ["Crew.create", "Crew.update", "Crew.status", "Crew.export"],
  SparePartUsage: ["SparePartUsage.create", "SparePartUsage.update", "SparePartUsage.status", "SparePartUsage.export"],
  Dispatch: [
    "派工确认占用名额",
    "派工冲突放行失败",
    "班组容量不足进入排队",
    "队列提升派工",
    "工单改派旧回传失效",
    "班组回传同步合并",
    "离线回传补录",
    "待对账记录核销"
  ]
};
