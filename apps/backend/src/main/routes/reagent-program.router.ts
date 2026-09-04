import express from "express";
import auth from "@middlewares/auth";
import adminOnly from "@middlewares/admin-only";
import {
    getReagentEnrollmentRules,
    getReagentEnrollmentStatus,
    postReagentJoin
} from "@main/controllers/reagent-program.controller";
import { getMyInvestLogs, getAllInvestLogs } from "@main/controllers/invest-log.controller";
import { getReagentTree } from "@main/controllers/reagent-tree.controller";

const router = express.Router();

router.get("/rules", getReagentEnrollmentRules);
router.get("/status", auth, getReagentEnrollmentStatus);
router.post("/join", auth, postReagentJoin);
router.get("/invest-logs", auth, getMyInvestLogs);
router.get("/tree", auth, getReagentTree);
router.get("/admin/invest-logs", auth, adminOnly, getAllInvestLogs);

export default router;