# 电力配网抢修工单系统

面向供电所的配网故障报修、抢修派工、备件领用和停电恢复跟踪平台。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20104>（默认打开「调度台」）

后端健康检查：<http://localhost:21104/health>

调度台状态：<http://localhost:21104/api/dispatch/state>

## 调度台（可续作派工）

调度台把抢修工单、抢修班组和备件领用接成一个可续作的派工工作台，核心规则：

- **接单判断**：按技能（`required_skill` vs `skill_tags`）、在手任务（`in_hand` vs `max_tasks`）、备件库存（`required_part_qty` vs `part_stock`）和值班状态判定班组能否接单，判定规则由后端 `DispatchService.evaluateCrew` 统一计算，前端展示与派工确认共用同一套结果。
- **排队**：班组容量不足时 `POST /api/dispatch/queue` 先排队；班组腾出容量后 `POST /api/dispatch/queue/:id/dispatch` 叫号派工。
- **占用名额**：`POST /api/dispatch/hold` 占用工单（默认 120s TTL，`DISPATCH_HOLD_TTL_MS` 可调）；确认派工 `POST /api/dispatch/confirm` 时再次校验占用。两个调度员同时确认同一单时，后端写路径经互斥锁串行化，只放行一个，另一人收到 `409 TICKET_HELD` 并看到占用者。
- **断网回传**：班组终端断网时回传暂存浏览器 localStorage（outbox），恢复网络后 `POST /api/dispatch/reports/sync` 批量合并；按 `client_report_id` 幂等，重复同步不产生重复记录。
- **改派对账**：`POST /api/dispatch/reassign` 把工单撤回待派工，旧班组已合并的回传全部判废并生成待对账记录；改派后才到达的迟到回传在合并时直接判废进待对账；`POST /api/dispatch/reconciliations/:id/resolve` 核销。
- **可续作**：队列、占用、回传、待对账、操作日志全部落盘到 `backend/data/dispatch-state.json`（tmp+rename 原子写），刷新页面或重启后端都在；`POST /api/dispatch/reset` 可重置演示数据。

演示多人冲突：开两个浏览器标签页，顶部分别选择不同调度员（张伟/李静），对同一工单点「占用/确认派工」。

## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`（`/api` 由 Vite 代理到 `VITE_API_TARGET`，默认 `http://localhost:3000`）
- 后端：`cd backend && npm install && npm run dev`，接口统一挂在 `/api`。


## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + TypeScript + Vite + Element Plus + Pinia |
| 后端 | Node.js + Express + TypeScript + Prisma |
| 数据库 | MySQL 8.0 |
| 部署 | Docker Compose |

## 项目目录结构

```text
frontend/src/api, stores, types, constants, constructors, components/common, hooks, pages, router, utils, mocks
backend/src/routes, controllers, services, models, repositories, middlewares, constants, constructors, utils, types, config
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`: Compose 项目名，默认 `grid-repair`
- `FRONTEND_PORT`: 前端端口，默认 `20104`
- `BACKEND_PORT`: 后端端口，默认 `21104`
- `DB_PORT`: 数据库宿主机端口
- `DB_USER/DB_PASSWORD/DB_NAME`: 本地数据库凭据
- `DISPATCH_HOLD_TTL_MS`: 派工占用名额有效期（毫秒），默认 `120000`
- `DISPATCH_STATE_FILE`: 调度台状态落盘文件路径，默认 `backend/data/dispatch-state.json`
- `VITE_API_TARGET`: 前端本地开发时 `/api` 的代理目标，默认 `http://localhost:3000`

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: grid-repair`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-grid-repair}` 前缀。
- 数据库使用命名卷，避免绑定中文路径。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- FaultType: constants/FaultType、types/FaultType、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- TicketStatus: constants/TicketStatus、types/TicketStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- AssetHealthStatus: constants/AssetHealthStatus、types/AssetHealthStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- QueueStatus: constants/QueueStatus（前后端各一份）、models/QueueEntry、statusText、DispatchPage 队列面板。
- CrewReportType / CrewReportStatus: constants/CrewReportType、constants/CrewReportStatus、models/CrewReport、DispatchConstructor、回传终端与回传记录。
- ReconciliationStatus: constants/ReconciliationStatus、models/Reconciliation、待对账面板。
- 调度错误码: constants/errorCodes + constants/errorMessages（前后端各一份），DispatchService 抛出、DispatchController 包装、DispatchStore 展示。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。

## License

MIT
