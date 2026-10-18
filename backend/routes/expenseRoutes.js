import express from "express";

import {
  createExpense,
  getGroupExpenses,
  getExpenseById,
  deleteExpense,
  updateExpense,
} from "../controllers/expenseController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Every expense route requires authentication
router.use(protect);

// Create expense
router.post("/", createExpense);

// Get all expenses of a group
router.get("/group/:groupId", getGroupExpenses);

// Get single expense
router.get("/:id", getExpenseById);

// Delete expense
router.patch("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;