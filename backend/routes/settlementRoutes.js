import express from "express";

import {
  createSettlement,
  getGroupSettlements,
  getSettlementById,
  deleteSettlement,
} from "../controllers/settlementController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// All settlement routes require authentication
router.use(protect);

// Create settlement
router.post("/", createSettlement);

// Get all settlements of group
router.get(
  "/group/:groupId",
  getGroupSettlements
);

// Get single settlement
router.get(
  "/:id",
  getSettlementById
);

// Delete settlement
router.delete(
  "/:id",
  deleteSettlement
);

export default router;