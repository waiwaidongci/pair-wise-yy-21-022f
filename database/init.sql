CREATE TABLE IF NOT EXISTS grid_asset (
  id INTEGER PRIMARY KEY,
  asset_code TEXT,
  asset_type TEXT,
  feeder_line TEXT,
  voltage_level TEXT,
  location_desc TEXT,
  health_status TEXT,
  owner_team_id TEXT
);

CREATE TABLE IF NOT EXISTS fault_report (
  id INTEGER PRIMARY KEY,
  reporter_name TEXT,
  phone TEXT,
  asset_id TEXT,
  fault_type TEXT,
  address_desc TEXT,
  severity TEXT,
  report_channel TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS repair_ticket (
  id INTEGER PRIMARY KEY,
  fault_report_id TEXT,
  team_id TEXT,
  dispatcher_id TEXT,
  dispatcher_name TEXT,
  priority TEXT,
  status TEXT,
  assigned_at TEXT,
  restored_at TEXT,
  required_skill TEXT,
  required_part_code TEXT,
  required_part_qty INTEGER,
  summary TEXT
);

CREATE TABLE IF NOT EXISTS crew (
  id INTEGER PRIMARY KEY,
  name TEXT,
  leader_id TEXT,
  skill_tags TEXT,
  duty_status TEXT,
  current_ticket_id TEXT,
  contact_phone TEXT,
  max_tasks INTEGER
);

CREATE TABLE IF NOT EXISTS spare_part_usage (
  id INTEGER PRIMARY KEY,
  ticket_id TEXT,
  part_code TEXT,
  part_name TEXT,
  quantity TEXT,
  warehouse_name TEXT,
  approved_by TEXT,
  usage_status TEXT
);

CREATE TABLE IF NOT EXISTS part_stock (
  part_code TEXT PRIMARY KEY,
  part_name TEXT,
  warehouse_name TEXT,
  stock INTEGER
);

CREATE TABLE IF NOT EXISTS dispatch_hold (
  ticket_id INTEGER PRIMARY KEY,
  dispatcher TEXT,
  acquired_at TEXT,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS dispatch_queue (
  id INTEGER PRIMARY KEY,
  ticket_id INTEGER,
  crew_id INTEGER,
  queued_by TEXT,
  queued_at TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS crew_report (
  client_report_id TEXT PRIMARY KEY,
  ticket_id INTEGER,
  crew_id INTEGER,
  type TEXT,
  content TEXT,
  reported_at TEXT,
  merged_at TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS reconciliation (
  id INTEGER PRIMARY KEY,
  report_client_id TEXT,
  ticket_id INTEGER,
  crew_id INTEGER,
  reason TEXT,
  status TEXT,
  created_at TEXT,
  resolved_at TEXT,
  resolved_by TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY,
  actor TEXT,
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  created_at TEXT
);
