export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  DISPATCH_CONFLICT: "该工单已被其他调度员占用，请刷新后查看占用者",
  CREW_CAPACITY_FULL: "该班组在手任务已满，已进入排队",
  SKILL_MISMATCH: "该班组技能不匹配，无法接单",
  SPARE_PART_MISSING: "所需备件库存不足，无法接单",
  CREW_OFF_DUTY: "该班组当前不在值班状态",
  TICKET_NOT_DISPATCHABLE: "当前工单状态不允许派工",
  OCCUPANCY_NOT_FOUND: "占用记录不存在或已释放",
  CALLBACK_INVALID: "回传已失效，转入待对账",
  QUEUE_ENTRY_NOT_FOUND: "排队记录不存在",
  RECONCILIATION_NOT_FOUND: "待对账记录不存在"
};
