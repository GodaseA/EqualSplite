import Group from "../models/Group.js";
import User from "../models/User.js";

// ============================
// CREATE GROUP
// ============================

export const createGroup = async (req, res) => {
  try {
    const { name, members = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    // Remove duplicate members
    const uniqueMembers = [
      ...new Set(members.map((id) => id.toString())),
    ];

    // Make sure creator is also a member
    if (!uniqueMembers.includes(req.user._id.toString())) {
      uniqueMembers.push(req.user._id.toString());
    }

    // Check whether users exist
    const users = await User.find({
      _id: { $in: uniqueMembers },
    }).select("_id");

    if (users.length !== uniqueMembers.length) {
      return res.status(400).json({
        success: false,
        message: "One or more users do not exist",
      });
    }

    const group = await Group.create({
      name,
      createdBy: req.user._id,
      members: uniqueMembers,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group: populatedGroup,
    });
  } catch (error) {
    console.error("Create Group Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ============================
// GET MY GROUPS
// ============================

export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id,
    })
      .populate("createdBy", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    console.error("Get Groups Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ============================
// GET SINGLE GROUP
// ============================

export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await Group.findById(id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check whether user belongs to group
    const isMember = group.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Get Group Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ============================
// ADD MEMBER
// ============================

export const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Only group creator can add members
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only group creator can add members",
      });
    }

    // Check user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check already member
    if (group.members.some((member) => member.toString() === userId.toString())) {
      return res.status(400).json({
        success: false,
        message: "User is already a group member",
      });
    }

    group.members.push(userId);

    await group.save();

    const updatedGroup = await Group.findById(id)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Add Member Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ============================
// REMOVE MEMBER
// ============================

export const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const group = await Group.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Only creator can remove members
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only group creator can remove members",
      });
    }

    // Creator cannot remove himself
    if (group.createdBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Group creator cannot be removed",
      });
    }

    const memberExists = group.members.some(
      (member) => member.toString() === userId
    );

    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this group",
      });
    }

    group.members = group.members.filter(
      (member) => member.toString() !== userId
    );

    await group.save();

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove Member Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};