# 电力配网抢修工单系统

面向供电所的配网故障报修、抢修派工、备件领用和停电恢复跟踪平台。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

## 访问地址或 CLI 示例

前端：<http://localhost:20104>

后端健康检查：<http://localhost:21104/health>


## 本地开发方式

- 前端：`cd frontend && npm install && npm run dev`
- 后端：进入 `backend` 后按技术栈运行开发命令，接口统一挂在 `/api`。


## 可续作调度台（核心特性）

供电所不再只有静态工单卡片。`/tickets` 页面是「可续作调度台」，把抢修工单、抢修班组和备件领用接成同一个状态面板，后端持久化调度状态，重开页面队列、占用和待对账记录都在。

- **按技能 / 在手任务 / 备件判断能否接单**：点「评估接单能力」，后端 `DispatchService.evaluateCrew` 综合班组技能标签、在手任务数（容量）、所需备件库存给出可接单判断与未满足原因。
- **容量不足先排队**：技能不符、在手任务已满或备件不足时不占名额，工单进入排队队列并记录原因。
- **派工确认占用名额**：`confirmDispatch` 以同步「读取—判断—写入」原子创建 `DispatchOccupancy`（状态 `HELD`），占用名额。
- **两个调度员同时确认同一单放行一个**：并发控制在占用写入前先查 `HELD` 记录，后到的调度员收到 `409 CONFLICT` 并看到占用者（班组 + 调度员）。右上角可切换调度员 `#1/#2` 模拟。
- **断网保留回传，网络恢复合并**：班组回传先存浏览器 `localStorage` 离线队列，恢复网络后 `POST /api/dispatch/sync` 按 `client_id` 幂等合并；重复回传去重。
- **改派后旧回传失效进入待对账**：`reassign` 释放旧占用、把旧班组回传置为 `INVALID` 并写入 `PendingReconciliation`；改派成功后旧班组再补传也会被判失效。
- **重开页面都在**：队列、占用、待对账由后端文件存储持久化（`DISPATCH_DATA_DIR`，Compose 中挂命名卷 `dispatch_data` 到 `/app/data`），重启后端 / 刷新页面后状态不丢。

关键文件：

| 层 | 文件 |
|---|---|
| 后端服务 | `backend/src/services/DispatchService.ts` |
| 后端持久化 | `backend/src/repositories/FileStore.ts`、`DispatchRepository.ts` |
| 后端接口 | `backend/src/controllers/DispatchController.ts`、`backend/src/routes/DispatchRoutes.ts` |
| 后端模型 | `backend/src/models/DispatchQueue.ts`、`DispatchOccupancy.ts`、`CrewCallback.ts`、`PendingReconciliation.ts` |
| 前端面板 | `frontend/src/components/dispatch/DispatchConsole.vue`、`CrewCard.vue`、`QueuePanel.vue`、`ReconciliationPanel.vue`、`CallbackPanel.vue` |
| 前端状态 | `frontend/src/stores/DispatchStore.ts`、`frontend/src/hooks/useOfflineSync.ts` |

接口：`GET /api/dispatch/console`、`POST /api/dispatch/evaluate`、`POST /api/dispatch/confirm`、`POST /api/dispatch/reassign`、`POST /api/dispatch/callback`、`POST /api/dispatch/sync`、`POST /api/dispatch/reconciliations/:id/resolve`。

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

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: grid-repair`。
- 容器名均使用 `${COMPOSE_PROJECT_NAME:-grid-repair}` 前缀。
- 数据库使用命名卷，避免绑定中文路径。
- 常见问题：端口占用时修改 `.env` 中端口后重启；需要重置数据时执行 `docker compose down -v`。

## 枚举/常量出现位置清单

- FaultType: constants/FaultType、types/FaultType、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- TicketStatus: constants/TicketStatus、types/TicketStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。
- AssetHealthStatus: constants/AssetHealthStatus、types/AssetHealthStatus、constructors、logTemplates、errorMessages、筛选器、展示组件/控制器均有引用。

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误消息、构造器、筛选器和展示组件被刻意拆散到多个目录；修改一个状态值通常需要同步类型、构造器、服务、控制器、store、页面、README 与数据库种子。

## License

MIT
