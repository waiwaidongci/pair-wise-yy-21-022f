import { Router } from "express";
import { dispatchController } from "../controllers/DispatchController";
import { rbacMiddleware } from "../middlewares/rbacMiddleware";

const router = Router();
const dispatcherOnly = rbacMiddleware(["dispatcher", "admin"]);

router.get("/state", dispatchController.state);
router.post("/hold", dispatcherOnly, dispatchController.hold);
router.post("/release", dispatcherOnly, dispatchController.release);
router.post("/confirm", dispatcherOnly, dispatchController.confirm);
router.post("/queue", dispatcherOnly, dispatchController.enqueue);
router.post("/queue/:id/cancel", dispatcherOnly, dispatchController.cancelQueue);
router.post("/queue/:id/dispatch", dispatcherOnly, dispatchController.dispatchQueue);
router.post("/reassign", dispatcherOnly, dispatchController.reassign);
router.post("/reports/sync", dispatchController.syncReports);
router.post("/reconciliations/:id/resolve", dispatcherOnly, dispatchController.resolveReconciliation);
router.post("/reset", dispatchController.reset);

export default router;
