export const mockData = {
  gridAsset: [
    { id: 1, asset_code: "GA-2024-001", asset_type: "TRANSFORMER", feeder_line: "城东线", voltage_level: "10kV", location_desc: "城东新区1号环网柜", health_status: "NORMAL", owner_team_id: 1 },
    { id: 2, asset_code: "GA-2024-002", asset_type: "CABINET", feeder_line: "城西线", voltage_level: "10kV", location_desc: "城西工业园3号开闭所", health_status: "WATCH", owner_team_id: 2 },
    { id: 3, asset_code: "GA-2024-003", asset_type: "LINE", feeder_line: "南环线", voltage_level: "10kV", location_desc: "南环变电站出线柜", health_status: "DEGRADED", owner_team_id: 3 },
    { id: 4, asset_code: "GA-2024-004", asset_type: "POLE", feeder_line: "城北线", voltage_level: "0.4kV", location_desc: "北街老旧小区立杆", health_status: "DANGEROUS", owner_team_id: 3 },
    { id: 5, asset_code: "GA-2024-005", asset_type: "CABLE", feeder_line: "开发区专线", voltage_level: "10kV", location_desc: "开发区10kV专线", health_status: "NORMAL", owner_team_id: 2 },
    { id: 6, asset_code: "GA-2024-006", asset_type: "METER", feeder_line: "滨河线", voltage_level: "0.4kV", location_desc: "滨河路商铺表计", health_status: "NORMAL", owner_team_id: 4 }
  ],
  faultReport: [
    { id: 1, reporter_name: "刘建国", phone: "13900000001", asset_id: 1, fault_type: "OUTAGE", address_desc: "城东新区12栋停电", severity: "紧急", report_channel: "电话", status: "ASSIGNED" },
    { id: 2, reporter_name: "孙丽", phone: "13900000002", asset_id: 2, fault_type: "VOLTAGE_LOW", address_desc: "城西工业园3号厂房电压低", severity: "高", report_channel: "APP", status: "ASSIGNED" },
    { id: 3, reporter_name: "周涛", phone: "13900000003", asset_id: 3, fault_type: "TRIP", address_desc: "南环变电站出线柜跳闸", severity: "紧急", report_channel: "电话", status: "WAIT_DISPATCH" },
    { id: 4, reporter_name: "吴敏", phone: "13900000004", asset_id: 4, fault_type: "SAFETY_RISK", address_desc: "北街老旧小区立杆倾斜", severity: "紧急", report_channel: "APP", status: "WAIT_DISPATCH" },
    { id: 5, reporter_name: "郑浩", phone: "13900000005", asset_id: 5, fault_type: "EQUIPMENT_DAMAGE", address_desc: "开发区10kV专线电缆破损", severity: "高", report_channel: "电话", status: "WAIT_DISPATCH" },
    { id: 6, reporter_name: "冯刚", phone: "13900000006", asset_id: 6, fault_type: "VOLTAGE_LOW", address_desc: "滨河路商铺电压低", severity: "中", report_channel: "APP", status: "WAIT_DISPATCH" }
  ],
  repairTicket: [
    { id: 1, fault_report_id: 1, team_id: 1, dispatcher_id: 1, priority: "紧急", status: "REPAIRING", assigned_at: "2026-10-05T08:00:00Z", restored_at: "" },
    { id: 2, fault_report_id: 2, team_id: 2, dispatcher_id: 1, priority: "高", status: "ASSIGNED", assigned_at: "2026-10-05T09:00:00Z", restored_at: "" },
    { id: 3, fault_report_id: 3, team_id: 0, dispatcher_id: 0, priority: "紧急", status: "WAIT_DISPATCH", assigned_at: "", restored_at: "" },
    { id: 4, fault_report_id: 4, team_id: 0, dispatcher_id: 0, priority: "紧急", status: "WAIT_DISPATCH", assigned_at: "", restored_at: "" },
    { id: 5, fault_report_id: 5, team_id: 0, dispatcher_id: 0, priority: "高", status: "WAIT_DISPATCH", assigned_at: "", restored_at: "" },
    { id: 6, fault_report_id: 6, team_id: 0, dispatcher_id: 0, priority: "中", status: "WAIT_DISPATCH", assigned_at: "", restored_at: "" }
  ],
  crew: [
    { id: 1, name: "张伟抢修班", leader_id: 101, skill_tags: "OUTAGE,TRIP", duty_status: "ON_DUTY", current_ticket_id: 1, contact_phone: "13800000001", capacity: 3 },
    { id: 2, name: "李强抢修班", leader_id: 102, skill_tags: "VOLTAGE_LOW,EQUIPMENT_DAMAGE", duty_status: "ON_DUTY", current_ticket_id: 2, contact_phone: "13800000002", capacity: 2 },
    { id: 3, name: "王勇抢修班", leader_id: 103, skill_tags: "SAFETY_RISK,OUTAGE", duty_status: "ON_DUTY", current_ticket_id: 0, contact_phone: "13800000003", capacity: 2 },
    { id: 4, name: "陈杰抢修班", leader_id: 104, skill_tags: "TRIP,VOLTAGE_LOW", duty_status: "ON_DUTY", current_ticket_id: 0, contact_phone: "13800000004", capacity: 3 }
  ],
  partStock: [
    { id: 1, part_code: "PART-FUSE-01", part_name: "高压熔断器", stock: 12, applicable_fault_types: "OUTAGE,TRIP" },
    { id: 2, part_code: "PART-CABLE-02", part_name: "交联电缆", stock: 5, applicable_fault_types: "OUTAGE,EQUIPMENT_DAMAGE" },
    { id: 3, part_code: "PART-METER-03", part_name: "智能电表", stock: 8, applicable_fault_types: "VOLTAGE_LOW" },
    { id: 4, part_code: "PART-SWITCH-04", part_name: "负荷开关", stock: 2, applicable_fault_types: "SAFETY_RISK,TRIP" },
    { id: 5, part_code: "PART-TRANS-05", part_name: "配电变压器", stock: 0, applicable_fault_types: "EQUIPMENT_DAMAGE" }
  ],
  sparePartUsage: [
    { id: 1, ticket_id: 1, part_code: "PART-FUSE-01", part_name: "高压熔断器", quantity: 2, warehouse_name: "城东仓", approved_by: "仓管-赵", usage_status: "CONSUMED" },
    { id: 2, ticket_id: 2, part_code: "PART-METER-03", part_name: "智能电表", quantity: 1, warehouse_name: "城西仓", approved_by: "仓管-赵", usage_status: "APPROVED" }
  ]
} as const;
