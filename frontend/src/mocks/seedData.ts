// 与 backend/src/seed.ts 保持一致，仅作接口不可用时的本地兜底展示。
export const mockData = {
  gridAsset: [
    { id: 1, asset_code: "CN-10KV-CY1", asset_type: "FEEDER", feeder_line: "10kV 城一线", voltage_level: "MEDIUM", location_desc: "城东 10kV 城一线主干 12 号杆", health_status: "DANGEROUS", owner_team_id: 1 },
    { id: 2, asset_code: "CN-1KV-HX2", asset_type: "CABLE", feeder_line: "1kV 河西支线", voltage_level: "LOW", location_desc: "河西小区 2 号箱变进线", health_status: "DEGRADED", owner_team_id: 2 },
    { id: 3, asset_code: "CN-10KV-TQ3", asset_type: "TRANSFORMER", feeder_line: "10kV 台区线", voltage_level: "MEDIUM", location_desc: "台区 3 号配电变压器", health_status: "WATCH", owner_team_id: 3 },
    { id: 4, asset_code: "CN-10KV-HW4", asset_type: "SWITCHGEAR", feeder_line: "10kV 环湖线", voltage_level: "MEDIUM", location_desc: "环湖路环网柜 4 间隔", health_status: "NORMAL", owner_team_id: 4 }
  ],
  faultReport: [
    { id: 1, reporter_name: "王先生", phone: "13800000001", asset_id: 1, fault_type: "OUTAGE", address_desc: "城东街道整片停电", severity: "HIGH", report_channel: "95598", status: "OPEN" },
    { id: 2, reporter_name: "李女士", phone: "13800000002", asset_id: 2, fault_type: "VOLTAGE_LOW", address_desc: "河西小区电压不稳", severity: "MEDIUM", report_channel: "APP", status: "OPEN" },
    { id: 3, reporter_name: "赵师傅", phone: "13800000003", asset_id: 3, fault_type: "EQUIPMENT_DAMAGE", address_desc: "台区变压器漏油异响", severity: "HIGH", report_channel: "巡检上报", status: "OPEN" },
    { id: 4, reporter_name: "陈先生", phone: "13800000004", asset_id: 4, fault_type: "SAFETY_RISK", address_desc: "环网柜柜门放电痕迹", severity: "LOW", report_channel: "营业厅", status: "MERGED" }
  ],
  repairTicket: [
    { id: 1, fault_report_id: 1, team_id: 0, dispatcher_id: 0, dispatcher_name: "", priority: "P1", status: "WAIT_DISPATCH", assigned_at: "", restored_at: "", required_skill: "架空线路", required_part_code: "FUSE-10KV", required_part_qty: 2, summary: "10kV 城一线 12 号杆熔断器烧毁，整线停电" },
    { id: 2, fault_report_id: 2, team_id: 0, dispatcher_id: 0, dispatcher_name: "", priority: "P2", status: "WAIT_DISPATCH", assigned_at: "", restored_at: "", required_skill: "电缆", required_part_code: "CABLE-1KV", required_part_qty: 1, summary: "河西小区箱变进线电缆绝缘击穿" },
    { id: 3, fault_report_id: 3, team_id: 0, dispatcher_id: 0, dispatcher_name: "", priority: "P1", status: "WAIT_DISPATCH", assigned_at: "", restored_at: "", required_skill: "变压器", required_part_code: "TRANS-400", required_part_qty: 1, summary: "台区 3 号变压器漏油，需整体更换" },
    { id: 4, fault_report_id: 4, team_id: 0, dispatcher_id: 0, dispatcher_name: "", priority: "P3", status: "WAIT_DISPATCH", assigned_at: "", restored_at: "", required_skill: "开关柜", required_part_code: "", required_part_qty: 0, summary: "环湖路环网柜 4 间隔异响，停电检查" },
    { id: 5, fault_report_id: 2, team_id: 0, dispatcher_id: 0, dispatcher_name: "", priority: "P2", status: "WAIT_DISPATCH", assigned_at: "", restored_at: "", required_skill: "电缆", required_part_code: "CABLE-1KV", required_part_qty: 1, summary: "道路施工挖断 1kV 河西支线电缆" },
    { id: 9, fault_report_id: 2, team_id: 0, dispatcher_id: 0, dispatcher_name: "", priority: "P3", status: "WAIT_DISPATCH", assigned_at: "", restored_at: "", required_skill: "电缆", required_part_code: "CABLE-1KV", required_part_qty: 1, summary: "城西分支电缆接头过热，需更换电缆段" },
    { id: 6, fault_report_id: 1, team_id: 1, dispatcher_id: 1, dispatcher_name: "张伟", priority: "P2", status: "ASSIGNED", assigned_at: "2026-10-06T01:20:00.000Z", restored_at: "", required_skill: "架空线路", required_part_code: "INSULATOR", required_part_qty: 4, summary: "城一线支线绝缘子击穿更换" },
    { id: 7, fault_report_id: 4, team_id: 2, dispatcher_id: 1, dispatcher_name: "张伟", priority: "P2", status: "REPAIRING", assigned_at: "2026-10-06T00:40:00.000Z", restored_at: "", required_skill: "开关柜", required_part_code: "SWITCH-10KV", required_part_qty: 1, summary: "环湖线环网柜出线开关更换" },
    { id: 8, fault_report_id: 3, team_id: 5, dispatcher_id: 2, dispatcher_name: "李静", priority: "P3", status: "RESTORED", assigned_at: "2026-10-05T09:00:00.000Z", restored_at: "2026-10-05T11:30:00.000Z", required_skill: "变压器", required_part_code: "", required_part_qty: 0, summary: "台区变压器档位调整（已复电）" }
  ],
  crew: [
    { id: 1, name: "配电一班", leader_id: 11, skill_tags: "架空线路,变压器", duty_status: "ON_DUTY", current_ticket_id: 6, contact_phone: "13900000001", max_tasks: 2 },
    { id: 2, name: "配电二班", leader_id: 12, skill_tags: "电缆,开关柜", duty_status: "ON_DUTY", current_ticket_id: 7, contact_phone: "13900000002", max_tasks: 2 },
    { id: 3, name: "电缆抢修班", leader_id: 13, skill_tags: "电缆,架空线路", duty_status: "ON_DUTY", current_ticket_id: 0, contact_phone: "13900000003", max_tasks: 1 },
    { id: 4, name: "带电作业班", leader_id: 14, skill_tags: "变压器,开关柜,带电作业", duty_status: "REST", current_ticket_id: 0, contact_phone: "13900000004", max_tasks: 1 },
    { id: 5, name: "应急综合班", leader_id: 15, skill_tags: "架空线路,电缆,变压器,开关柜", duty_status: "ON_DUTY", current_ticket_id: 0, contact_phone: "13900000005", max_tasks: 3 }
  ],
  sparePartUsage: [
    { id: 1, ticket_id: 7, part_code: "SWITCH-10KV", part_name: "柱上开关", quantity: 1, warehouse_name: "城郊库", approved_by: "张伟", usage_status: "OUT" },
    { id: 2, ticket_id: 8, part_code: "TRANS-400", part_name: "配电变压器 400kVA", quantity: 1, warehouse_name: "城郊库", approved_by: "李静", usage_status: "CONSUMED" }
  ],
  partStock: [
    { part_code: "FUSE-10KV", part_name: "跌落式熔断器", warehouse_name: "城区中心库", stock: 5 },
    { part_code: "CABLE-1KV", part_name: "1kV 交联电缆(百米)", warehouse_name: "城区中心库", stock: 2 },
    { part_code: "TRANS-400", part_name: "配电变压器 400kVA", warehouse_name: "城郊库", stock: 1 },
    { part_code: "SWITCH-10KV", part_name: "柱上开关", warehouse_name: "城郊库", stock: 1 },
    { part_code: "INSULATOR", part_name: "棒式绝缘子", warehouse_name: "城区中心库", stock: 8 }
  ]
};
