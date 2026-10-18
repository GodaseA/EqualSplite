import User from "../models/User.js";

export const searchUsers = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) return res.json({ success: true, users: [] });
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
        { email: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
      ],
    }).select("name email profileImage").limit(10);
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to search users" });
  }
};
