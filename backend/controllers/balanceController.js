import Expense from "../models/Expense.js";
import Settlement from "../models/Settlement.js";
import Group from "../models/Group.js";

const money = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId).populate("members", "name email profileImage");
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    if (!group.members.some((m) => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const [expenses, settlements] = await Promise.all([
      Expense.find({ groupId }), Settlement.find({ groupId }),
    ]);
    const balances = {};
    for (const member of group.members) balances[member._id.toString()] = {
      user: member._id, name: member.name, email: member.email, profileImage: member.profileImage || "", paid: 0, share: 0, settlementPaid: 0, settlementReceived: 0, balance: 0,
    };

    for (const expense of expenses) {
      for (const p of expense.paidBy) if (balances[p.user.toString()]) balances[p.user.toString()].paid += Number(p.amount);
      for (const s of expense.splits) if (balances[s.user.toString()]) balances[s.user.toString()].share += Number(s.amount);
    }
    // A recorded settlement means paidBy paid paidTo, reducing payer debt and creditor credit.
    for (const settlement of settlements) {
      const payer = balances[settlement.paidBy.toString()];
      const receiver = balances[settlement.paidTo.toString()];
      if (payer) payer.settlementPaid += Number(settlement.amount);
      if (receiver) receiver.settlementReceived += Number(settlement.amount);
    }
    for (const user of Object.values(balances)) {
      user.paid = money(user.paid); user.share = money(user.share);
      user.settlementPaid = money(user.settlementPaid); user.settlementReceived = money(user.settlementReceived);
      user.balance = money(user.paid - user.share + user.settlementPaid - user.settlementReceived);
    }

    const creditors = Object.values(balances).filter((u) => u.balance > 0.009).map((u) => ({ user: u.user, name: u.name, amount: u.balance }));
    const debtors = Object.values(balances).filter((u) => u.balance < -0.009).map((u) => ({ user: u.user, name: u.name, amount: money(Math.abs(u.balance)) }));
    const settlementsRequired = [];
    let ci = 0, di = 0;
    while (ci < creditors.length && di < debtors.length) {
      const amount = money(Math.min(creditors[ci].amount, debtors[di].amount));
      if (amount > 0) settlementsRequired.push({ from: { user: debtors[di].user, name: debtors[di].name }, to: { user: creditors[ci].user, name: creditors[ci].name }, amount });
      creditors[ci].amount = money(creditors[ci].amount - amount);
      debtors[di].amount = money(debtors[di].amount - amount);
      if (creditors[ci].amount <= 0.009) ci++;
      if (debtors[di].amount <= 0.009) di++;
    }
    res.json({ success: true, group: { id: group._id, name: group.name }, balances: Object.values(balances), settlementsRequired, totals: { expenses: money(expenses.reduce((s, e) => s + e.amount, 0)), settlements: money(settlements.reduce((s, x) => s + x.amount, 0)) } });
  } catch (error) {
    console.error("Balance Error:", error);
    res.status(500).json({ success: false, message: "Unable to calculate group balances" });
  }
};
