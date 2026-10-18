import express from "express";

import {
  getGroupBalances,
} from "../controllers/balanceController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Get balances of a group
router.get(
  "/group/:groupId",
  getGroupBalances
);

export default router;