import Settlement from "../models/Settlement.js";
import Group from "../models/Group.js";
import User from "../models/User.js";

// ========================================
// CREATE SETTLEMENT
// ========================================

export const createSettlement = async (req, res) => {
  try {
    const {
      groupId,
      paidTo,
      amount,
      note = "",
    } = req.body;

    // ----------------------------------------
    // Validate input
    // ----------------------------------------

    if (!groupId || !paidTo || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "groupId, paidTo and amount are required",
      });
    }

    const settlementAmount = Number(amount);

    if (
      !Number.isFinite(settlementAmount) ||
      settlementAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Settlement amount must be greater than 0",
      });
    }

    // ----------------------------------------
    // Prevent paying yourself
    // ----------------------------------------

    if (req.user._id.toString() === paidTo.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot settle with yourself",
      });
    }

    // ----------------------------------------
    // Find group
    // ----------------------------------------

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // ----------------------------------------
    // Check current user is member
    // ----------------------------------------

    const isPayerMember = group.members.some(
      (member) =>
        member.toString() === req.user._id.toString()
    );

    if (!isPayerMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    // ----------------------------------------
    // Check receiver is member
    // ----------------------------------------

    const isReceiverMember = group.members.some(
      (member) =>
        member.toString() === paidTo.toString()
    );

    if (!isReceiverMember) {
      return res.status(400).json({
        success: false,
        message: "Receiver is not a member of this group",
      });
    }

    // ----------------------------------------
    // Check receiver user exists
    // ----------------------------------------

    const receiver = await User.findById(paidTo);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    // ----------------------------------------
    // Create settlement
    // ----------------------------------------

    const settlement = await Settlement.create({
      groupId,
      paidBy: req.user._id,
      paidTo,
      amount: settlementAmount,
      note,
    });

    const populatedSettlement =
      await Settlement.findById(settlement._id)
        .populate("groupId", "name")
        .populate("paidBy", "name email")
        .populate("paidTo", "name email");

    res.status(201).json({
      success: true,
      message: "Settlement recorded successfully",
      settlement: populatedSettlement,
    });
  } catch (error) {
    console.error("Create Settlement Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ========================================
// GET GROUP SETTLEMENTS
// ========================================

export const getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;

    // ----------------------------------------
    // Find group
    // ----------------------------------------

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // ----------------------------------------
    // Check membership
    // ----------------------------------------

    const isMember = group.members.some(
      (member) =>
        member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    // ----------------------------------------
    // Get settlements
    // ----------------------------------------

    const settlements = await Settlement.find({
      groupId,
    })
      .populate("paidBy", "name email")
      .populate("paidTo", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: settlements.length,
      settlements,
    });
  } catch (error) {
    console.error("Get Settlements Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ========================================
// GET SINGLE SETTLEMENT
// ========================================

export const getSettlementById = async (req, res) => {
  try {
    const { id } = req.params;

    const settlement = await Settlement.findById(id)
      .populate("groupId")
      .populate("paidBy", "name email")
      .populate("paidTo", "name email");

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found",
      });
    }

    // ----------------------------------------
    // Check membership
    // ----------------------------------------

    const group = settlement.groupId;

    const isMember = group.members.some(
      (member) =>
        member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    res.status(200).json({
      success: true,
      settlement,
    });
  } catch (error) {
    console.error("Get Settlement Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ========================================
// DELETE SETTLEMENT
// ========================================

export const deleteSettlement = async (req, res) => {
  try {
    const { id } = req.params;

    const settlement = await Settlement.findById(id);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found",
      });
    }

    const group = await Group.findById(
      settlement.groupId
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // ----------------------------------------
    // Check membership
    // ----------------------------------------

    const isMember = group.members.some(
      (member) =>
        member.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    // ----------------------------------------
    // Only payer or group creator can delete
    // ----------------------------------------

    const isPayer =
      settlement.paidBy.toString() ===
      req.user._id.toString();

    const isCreator =
      group.createdBy.toString() ===
      req.user._id.toString();

    if (!isPayer && !isCreator) {
      return res.status(403).json({
        success: false,
        message:
          "Only the payer or group creator can delete this settlement",
      });
    }

    await Settlement.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Settlement deleted successfully",
    });
  } catch (error) {
    console.error("Delete Settlement Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};