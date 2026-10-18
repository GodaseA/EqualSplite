import express from "express";

import {
  createGroup,
  getMyGroups,
  getGroupById,
  addMember,
  removeMember,
} from "../controllers/groupController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// All group routes require authentication
router.use(protect);

// Create group
router.post("/", createGroup);

// Get user's groups
router.get("/", getMyGroups);

// Get single group
router.get("/:id", getGroupById);

// Add member
router.post("/:id/members", addMember);

// Remove member
router.delete("/:id/members/:userId", removeMember);

export default router;