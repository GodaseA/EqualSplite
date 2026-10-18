import Expense from "../models/Expense.js";
import Group from "../models/Group.js";

// Helper: check whether user belongs to group
const checkGroupMember = async (groupId, userId) => {
  const group = await Group.findById(groupId);

  if (!group) {
    return {
      valid: false,
      status: 404,
      message: "Group not found",
    };
  }

  const isMember = group.members.some(
    (member) => member.toString() === userId.toString()
  );

  if (!isMember) {
    return {
      valid: false,
      status: 403,
      message: "You are not a member of this group",
    };
  }

  return {
    valid: true,
    group,
  };
};

// Round money to 2 decimal places
const roundMoney = (value) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

// ========================================
// CREATE EXPENSE
// ========================================

export const createExpense = async (req, res) => {
  try {
    const {
      groupId,
      description,
      amount,
      splitType = "equal",
      paidBy,
      splits,
      category = "other",
      notes = "",
    } = req.body;

    // ---------------------------
    // Basic validation
    // ---------------------------

    if (!groupId || !description || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "groupId, description and amount are required",
      });
    }

    const totalAmount = Number(amount);

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // ---------------------------
    // Check group
    // ---------------------------

    const groupCheck = await checkGroupMember(
      groupId,
      req.user._id
    );

    if (!groupCheck.valid) {
      return res.status(groupCheck.status).json({
        success: false,
        message: groupCheck.message,
      });
    }

    const group = groupCheck.group;

    // ---------------------------
    // Validate split type
    // ---------------------------

    if (!["equal", "exact", "percentage"].includes(splitType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid split type",
      });
    }

    // ---------------------------
    // Validate paidBy
    // ---------------------------

    if (!Array.isArray(paidBy) || paidBy.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one person must pay",
      });
    }

    // Check paidBy users are group members
    for (const payment of paidBy) {
      const isMember = group.members.some(
        (member) =>
          member.toString() === payment.user.toString()
      );

      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: "Payer must be a group member",
        });
      }
    }

    // Check total paid amount
    const totalPaid = paidBy.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    if (roundMoney(totalPaid) !== roundMoney(totalAmount)) {
      return res.status(400).json({
        success: false,
        message: `Total paid amount must equal expense amount (${totalAmount})`,
      });
    }

    // ========================================
    // CREATE SPLITS
    // ========================================

    let finalSplits = [];

    // ----------------------------------------
    // EQUAL SPLIT
    // ----------------------------------------

    if (splitType === "equal") {
      if (!Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Provide users for equal split",
        });
      }

      const share = totalAmount / splits.length;

      finalSplits = splits.map((split) => ({
        user: split.user,
        amount: roundMoney(share),
      }));

      // Fix rounding difference
      const calculatedTotal = finalSplits.reduce(
        (sum, split) => sum + split.amount,
        0
      );

      const difference = roundMoney(
        totalAmount - calculatedTotal
      );

      if (difference !== 0) {
        finalSplits[finalSplits.length - 1].amount =
          roundMoney(
            finalSplits[finalSplits.length - 1].amount +
              difference
          );
      }
    }

    // ----------------------------------------
    // EXACT SPLIT
    // ----------------------------------------

    else if (splitType === "exact") {
      if (!Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Provide exact split amounts",
        });
      }

      finalSplits = splits.map((split) => ({
        user: split.user,
        amount: roundMoney(Number(split.amount)),
      }));

      const splitTotal = finalSplits.reduce(
        (sum, split) => sum + split.amount,
        0
      );

      if (roundMoney(splitTotal) !== roundMoney(totalAmount)) {
        return res.status(400).json({
          success: false,
          message: "Exact split amounts must equal expense amount",
        });
      }
    }

    // ----------------------------------------
    // PERCENTAGE SPLIT
    // ----------------------------------------

    else if (splitType === "percentage") {
      if (!Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Provide percentage splits",
        });
      }

      const totalPercentage = splits.reduce(
        (sum, split) => sum + Number(split.percentage),
        0
      );

      if (roundMoney(totalPercentage) !== 100) {
        return res.status(400).json({
          success: false,
          message: "Percentages must add up to 100",
        });
      }

      finalSplits = splits.map((split) => ({
        user: split.user,
        percentage: Number(split.percentage),
        amount: roundMoney(
          (totalAmount * Number(split.percentage)) / 100
        ),
      }));

      // Fix rounding difference
      const calculatedTotal = finalSplits.reduce(
        (sum, split) => sum + split.amount,
        0
      );

      const difference = roundMoney(
        totalAmount - calculatedTotal
      );

      if (difference !== 0) {
        finalSplits[finalSplits.length - 1].amount =
          roundMoney(
            finalSplits[finalSplits.length - 1].amount +
              difference
          );
      }
    }

    // ========================================
    // Check split users belong to group
    // ========================================

    for (const split of finalSplits) {
      const isMember = group.members.some(
        (member) =>
          member.toString() === split.user.toString()
      );

      if (!isMember) {
        return res.status(400).json({
          success: false,
          message: "Every split user must be a group member",
        });
      }
    }

    // ========================================
    // CREATE EXPENSE
    // ========================================

    const expense = await Expense.create({
      groupId,
      description,
      amount: totalAmount,
      splitType,
      paidBy,
      splits: finalSplits,
      category,
      notes,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate("groupId", "name")
      .populate("paidBy.user", "name email")
      .populate("splits.user", "name email");

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense: populatedExpense,
    });
  } catch (error) {
    console.error("Create Expense Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// GET GROUP EXPENSES
// ========================================

export const getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    const groupCheck = await checkGroupMember(
      groupId,
      req.user._id
    );

    if (!groupCheck.valid) {
      return res.status(groupCheck.status).json({
        success: false,
        message: groupCheck.message,
      });
    }

    const expenses = await Expense.find({
      groupId,
    })
      .populate("paidBy.user", "name email")
      .populate("splits.user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    console.error("Get Expenses Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// GET SINGLE EXPENSE
// ========================================

export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id)
      .populate("groupId")
      .populate("paidBy.user", "name email")
      .populate("splits.user", "name email");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const group = expense.groupId;

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
      expense,
    });
  } catch (error) {
    console.error("Get Expense Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ========================================
// DELETE EXPENSE
// ========================================

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    const group = await Group.findById(expense.groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Only group creator or expense payer can delete
    const isCreator =
      group.createdBy.toString() === req.user._id.toString();

    const isPayer = expense.paidBy.some(
      (payment) =>
        payment.user.toString() === req.user._id.toString()
    );

    if (!isCreator && !isPayer) {
      return res.status(403).json({
        success: false,
        message:
          "Only group creator or expense payer can delete this expense",
      });
    }

    await Expense.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Delete Expense Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// Update descriptive fields without allowing balance-affecting data to be silently changed.
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
    const group = await Group.findById(expense.groupId);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    const isMember = group.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: "You are not a member of this group" });
    const isCreator = group.createdBy.toString() === req.user._id.toString();
    const isPayer = expense.paidBy.some((p) => p.user.toString() === req.user._id.toString());
    if (!isCreator && !isPayer) return res.status(403).json({ success: false, message: "Only the group creator or an expense payer can edit this expense" });
    const { description, category, notes } = req.body;
    if (description !== undefined) {
      if (!String(description).trim()) return res.status(400).json({ success: false, message: "Description cannot be empty" });
      expense.description = String(description).trim();
    }
    if (category !== undefined) expense.category = category;
    if (notes !== undefined) expense.notes = String(notes).trim();
    await expense.save();
    const updated = await Expense.findById(expense._id).populate("paidBy.user", "name email").populate("splits.user", "name email");
    res.json({ success: true, message: "Expense updated", expense: updated });
  } catch (error) {
    console.error("Update Expense Error:", error);
    res.status(500).json({ success: false, message: "Unable to update expense" });
  }
};
