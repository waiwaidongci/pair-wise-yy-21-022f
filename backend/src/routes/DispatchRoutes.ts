import { Router } from "express";
import { dispatchController } from "../controllers/DispatchController";

const router = Router();

router.get("/console", dispatchController.console);
router.post("/evaluate", dispatchController.evaluate);
router.post("/confirm", dispatchController.confirm);
router.post("/reassign", dispatchController.reassign);
router.post("/callback", dispatchController.callback);
router.post("/sync", dispatchController.sync);
router.post("/reconciliations/:id/resolve", dispatchController.resolveReconciliation);

export default router;
