import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// Place this file at src/App.jsx in a React + Vite project.
const API = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const api = axios.create({ baseURL: API });
const money = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(n || 0));

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("expense_token") || "");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [newGroup, setNewGroup] = useState("");
  const [expenseForm, setExpenseForm] = useState({ description: "", amount: "", category: "food", splitType: "equal", notes: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const client = useMemo(() => axios.create({ baseURL: API, headers: token ? { Authorization: `Bearer ${token}` } : {} }), [token]);
  const selectedGroup = groups.find((g) => g._id === groupId);

  useEffect(() => { if (token) loadInitial(); else { setUser(null); setGroups([]); setGroupId(""); } }, [token]);
  useEffect(() => { if (token && groupId) loadGroup(); }, [token, groupId]);

  async function loadInitial() {
    try {
      const [me, gs] = await Promise.all([client.get("/auth/me"), client.get("/groups")]);
      setUser(me.data.user); setGroups(gs.data.groups || []);
      if (!groupId && gs.data.groups?.length) setGroupId(gs.data.groups[0]._id);
    } catch (e) { logout(); setMessage(e.response?.data?.message || "Session expired. Please log in again."); }
  }
  async function loadGroup() {
    try {
      const [ex, bal, set] = await Promise.all([client.get(`/expenses/group/${groupId}`), client.get(`/balances/group/${groupId}`), client.get(`/settlements/group/${groupId}`)]);
      setExpenses(ex.data.expenses || []); setBalances(bal.data); setSettlements(set.data.settlements || []);
    } catch (e) { setMessage(e.response?.data?.message || "Could not load group data"); }
  }
  async function submitAuth(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const { data } = await axios.post(`${API}${path}`, auth);
      localStorage.setItem("expense_token", data.token); setToken(data.token); setUser(data.user); setMessage(data.message || "Welcome!");
    } catch (e) { setMessage(e.response?.data?.message || "Authentication failed"); }
    finally { setBusy(false); }
  }
  function logout() { localStorage.removeItem("expense_token"); setToken(""); setUser(null); setGroups([]); setExpenses([]); setBalances(null); setSettlements([]); }
  async function createGroup(e) {
    e.preventDefault(); if (!newGroup.trim()) return;
    try { const { data } = await client.post("/groups", { name: newGroup.trim(), members: [user.id || user._id] }); const next = [data.group, ...groups]; setGroups(next); setGroupId(data.group._id); setNewGroup(""); setMessage("Group created"); }
    catch (e) { setMessage(e.response?.data?.message || "Could not create group"); }
  }
  async function createExpense(e) {
    e.preventDefault(); if (!selectedGroup || !expenseForm.description.trim() || Number(expenseForm.amount) <= 0) return;
    const memberIds = selectedGroup.members.map((m) => typeof m === "string" ? m : m._id);
    const payerId = user.id || user._id;
    const amount = Math.round(Number(expenseForm.amount) * 100) / 100;
    const splits = memberIds.map((id) => ({ user: id }));
    try {
      await client.post("/expenses", { groupId, description: expenseForm.description.trim(), amount, splitType: "equal", paidBy: [{ user: payerId, amount }], splits, category: expenseForm.category, notes: expenseForm.notes });
      setExpenseForm({ description: "", amount: "", category: "food", splitType: "equal", notes: "" }); await loadGroup(); setMessage("Expense added");
    } catch (e) { setMessage(e.response?.data?.message || "Could not add expense"); }
  }
  async function recordSettlement(item) {
    if (!window.confirm(`Record ${money(item.amount)} paid to ${item.to.name}? This records a payment; it does not transfer money.`)) return;
    try { await client.post("/settlements", { groupId, paidTo: item.to.user, amount: item.amount, note: "Settlement recorded from suggested settlement" }); await loadGroup(); setMessage("Settlement recorded"); }
    catch (e) { setMessage(e.response?.data?.message || "Could not record settlement"); }
  }
  async function deleteExpense(id) {
    if (!window.confirm("Delete this expense? Group balances will be recalculated.")) return;
    try { await client.delete(`/expenses/${id}`); await loadGroup(); setMessage("Expense deleted"); }
    catch (e) { setMessage(e.response?.data?.message || "Could not delete expense"); }
  }

  const myBalance = balances?.balances?.find((b) => String(b.user) === String(user?.id || user?._id))?.balance || 0;
  if (!token || !user) return <main style={styles.authPage}><form onSubmit={submitAuth} style={styles.authCard}>
    <div style={styles.logo}>₹</div><p style={styles.eyebrow}>SPLIT SMARTER</p><h1>{authMode === "login" ? "Welcome back" : "Create your account"}</h1><p style={styles.muted}>Track shared expenses and settle up with your group.</p>
    {authMode === "register" && <label style={styles.label}>Full name<input style={styles.input} value={auth.name} onChange={(e) => setAuth({ ...auth, name: e.target.value })} required minLength={2} /></label>}
    <label style={styles.label}>Email<input style={styles.input} type="email" value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} required /></label>
    <label style={styles.label}>Password<input style={styles.input} type="password" minLength={6} value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} required /></label>
    {message && <p style={styles.notice}>{message}</p>}<button style={styles.primary} disabled={busy}>{busy ? "Please wait…" : authMode === "login" ? "Log in" : "Create account"}</button>
    <p style={styles.switch}>{authMode === "login" ? "New here?" : "Already have an account?"} <button type="button" style={styles.link} onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setMessage(""); }}>{authMode === "login" ? "Create an account" : "Log in"}</button></p>
  </form></main>;

  return <div style={styles.app}>
    <aside style={styles.sidebar}><div style={styles.brand}><span style={styles.brandIcon}>₹</span><span>Splitwise<span style={{ color: "#8b9aaf" }}>+</span></span></div><p style={styles.sideLabel}>YOUR WORKSPACE</p><div style={styles.navActive}>▦ &nbsp; Overview</div><p style={styles.sideLabel}>YOUR GROUPS</p>
      {groups.map((g) => <button key={g._id} onClick={() => setGroupId(g._id)} style={{ ...styles.groupButton, ...(groupId === g._id ? styles.groupSelected : {}) }}><span style={styles.groupIcon}>{(g.name || "G").slice(0, 1).toUpperCase()}</span><span>{g.name}</span></button>)}
      <form onSubmit={createGroup} style={styles.newGroupForm}><input aria-label="New group name" placeholder="New group name" style={styles.smallInput} value={newGroup} onChange={(e) => setNewGroup(e.target.value)} /><button style={styles.addButton} title="Create group">+</button></form>
      <div style={styles.sidebarBottom}><div style={styles.avatar}>{(user.name || "U").slice(0, 1).toUpperCase()}</div><div style={{ flex: 1, minWidth: 0 }}><strong>{user.name}</strong><small style={styles.email}>{user.email}</small></div><button onClick={logout} style={styles.iconButton} title="Log out">↪</button></div>
    </aside>
    <main style={styles.main}><header style={styles.header}><div><p style={styles.eyebrow}>PERSONAL FINANCE / GROUPS</p><h1>{selectedGroup?.name || "Your overview"}</h1><p style={styles.muted}>{selectedGroup ? `${selectedGroup.members?.length || 0} members · Created ${new Date(selectedGroup.createdAt).toLocaleDateString()}` : "Create a group to start tracking shared expenses."}</p></div><div style={styles.headerRight}><span style={styles.onlineDot}></span> All changes synced <button style={styles.outlineButton} onClick={() => groupId && loadGroup()}>↻ Refresh</button></div></header>
      {message && <div style={styles.noticeBar}>{message}<button onClick={() => setMessage("")} style={styles.dismiss}>×</button></div>}
      {selectedGroup && <><section style={styles.statsGrid}><Stat label="YOUR NET BALANCE" value={money(myBalance)} tone={myBalance >= 0 ? "green" : "red"} hint={myBalance > 0 ? "You are owed" : myBalance < 0 ? "You owe" : "All settled up"}/><Stat label="TOTAL GROUP SPENDING" value={money(balances?.totals?.expenses)} hint="All recorded expenses"/><Stat label="YOU PAID" value={money(balances?.balances?.find((b) => String(b.user) === String(user.id || user._id))?.paid)} hint="Your recorded payments"/><Stat label="GROUP MEMBERS" value={String(selectedGroup.members?.length || 0)} hint="Sharing this group"/></section>
      <section style={styles.contentGrid}><div style={styles.panel}><div style={styles.panelHead}><div><h2>Add an expense</h2><p style={styles.muted}>Split equally across all group members.</p></div><span style={styles.panelIcon}>＋</span></div><form onSubmit={createExpense} style={styles.expenseForm}><label style={styles.label}>What was it for?<input style={styles.input} placeholder="e.g. Dinner, groceries, taxi" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} required /></label><div style={styles.formRow}><label style={{ ...styles.label, flex: 1 }}>Amount (₹)<input style={styles.input} type="number" min="0.01" step="0.01" placeholder="0.00" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required /></label><label style={{ ...styles.label, flex: 1 }}>Category<select style={styles.input} value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>{["food","travel","hotel","shopping","entertainment","other"].map((c) => <option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}</select></label></div><label style={styles.label}>Notes (optional)<input style={styles.input} placeholder="Add a note" value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} /></label><div style={styles.splitInfo}>♧ &nbsp; Paid by you · Split equally between {selectedGroup.members?.length || 1} members</div><button style={styles.primary}>Add expense <span>→</span></button></form></div>
      <div style={styles.panel}><div style={styles.panelHead}><div><h2>Settlement plan</h2><p style={styles.muted}>Suggested payments to clear balances.</p></div><span style={styles.panelIcon}>⇄</span></div>{balances?.settlementsRequired?.length ? <div style={styles.settlementList}>{balances.settlementsRequired.map((s, i) => <div key={`${s.from.user}-${s.to.user}-${i}`} style={styles.settlementItem}><div style={styles.avatarSmall}>{s.from.name?.slice(0,1)}</div><div style={{ flex: 1 }}><strong>{s.from.name}</strong><p style={styles.mutedSmall}>pays {s.to.name}</p></div><div style={{ textAlign: "right" }}><strong>{money(s.amount)}</strong><button style={styles.settleButton} onClick={() => recordSettlement(s)}>Record payment</button></div></div>)}</div> : <div style={styles.empty}><div style={styles.emptyIcon}>✓</div><strong>You're all settled up!</strong><p style={styles.muted}>No outstanding payments in this group.</p></div>}<p style={styles.footnote}>Recording a payment only updates the app. It does not transfer money.</p></div></section>
      <section style={styles.panel}><div style={styles.panelHead}><div><h2>Recent expenses</h2><p style={styles.muted}>Your group's latest shared costs.</p></div><span style={styles.countPill}>{expenses.length} expenses</span></div>{expenses.length ? <div style={styles.tableWrap}><table style={styles.table}><thead><tr><th>EXPENSE</th><th>PAID BY</th><th>AMOUNT</th><th>YOUR SHARE</th><th></th></tr></thead><tbody>{expenses.map((ex) => { const payer = ex.paidBy?.map((p) => p.user?.name || "Member").join(", ") || "—"; const mySplit = ex.splits?.find((s) => String(s.user?._id || s.user) === String(user.id || user._id)); return <tr key={ex._id}><td><div style={styles.expenseName}><span style={styles.categoryIcon}>{categoryIcon(ex.category)}</span><div><strong>{ex.description}</strong><small style={styles.mutedSmall}>{ex.category || "other"} · {new Date(ex.createdAt).toLocaleDateString()}</small></div></div></td><td>{payer}</td><td><strong>{money(ex.amount)}</strong></td><td>{money(mySplit?.amount || 0)}</td><td><button style={styles.deleteButton} onClick={() => deleteExpense(ex._id)} title="Delete expense">×</button></td></tr>; })}</tbody></table></div> : <div style={styles.empty}><div style={styles.emptyIcon}>₹</div><strong>No expenses yet</strong><p style={styles.muted}>Add your first expense using the form above.</p></div>}</section>
      <section style={styles.panel}><div style={styles.panelHead}><div><h2>Group balances</h2><p style={styles.muted}>Net balance after expenses and recorded settlements.</p></div></div><div style={styles.balanceGrid}>{(balances?.balances || []).map((b) => <div style={styles.balancePerson} key={String(b.user)}><div style={styles.avatarSmall}>{b.name?.slice(0,1)}</div><div style={{ flex: 1 }}><strong>{b.name}</strong><p style={styles.mutedSmall}>Paid {money(b.paid)} · Share {money(b.share)}</p></div><strong style={{ color: b.balance > 0.009 ? "#15803d" : b.balance < -0.009 ? "#dc2626" : "#64748b" }}>{b.balance > 0 ? "+" : ""}{money(b.balance)}</strong></div>)}</div></section>
      <section style={styles.panel}><div style={styles.panelHead}><div><h2>Settlement history</h2><p style={styles.muted}>Payments recorded in this group.</p></div><span style={styles.countPill}>{settlements.length} records</span></div>{settlements.length ? settlements.map((s) => <div key={s._id} style={styles.historyRow}><span style={styles.historyIcon}>✓</span><div style={{ flex: 1 }}><strong>{s.paidBy?.name} paid {s.paidTo?.name}</strong><p style={styles.mutedSmall}>{s.note || "Settlement"} · {new Date(s.createdAt).toLocaleDateString()}</p></div><strong>{money(s.amount)}</strong></div>) : <p style={styles.muted}>No settlements recorded yet.</p>}</section></>}
      <footer style={styles.footer}>Splitwise+ · Keep shared spending simple <span>Made for groups, trips and everyday life.</span></footer>
    </main>
  </div>;
}
function Stat({ label, value, tone, hint }) { return <div style={styles.statCard}><p style={styles.statLabel}>{label}</p><h2 style={{ color: tone === "green" ? "#15803d" : tone === "red" ? "#dc2626" : "#111827" }}>{value || money(0)}</h2><p style={styles.statHint}>{hint}</p></div>; }
function categoryIcon(c) { return ({ food: "♨", travel: "✈", hotel: "⌂", shopping: "◇", entertainment: "♫", other: "₹" })[c] || "₹"; }

const styles = {
  app: { minHeight: "100vh", display: "flex", background: "#f6f8fb", color: "#172033", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  sidebar: { width: 250, background: "#111c31", color: "#e8edf7", padding: "26px 16px 16px", display: "flex", flexDirection: "column", flexShrink: 0, minHeight: "100vh", boxSizing: "border-box" },
  brand: { display: "flex", gap: 10, alignItems: "center", fontSize: 21, fontWeight: 800, padding: "0 8px 34px", letterSpacing: "-.6px" }, brandIcon: { background: "#54d6a0", color: "#102d28", width: 34, height: 34, borderRadius: 11, display: "grid", placeItems: "center", fontWeight: 900 },
  sideLabel: { fontSize: 10, color: "#8b9aaf", letterSpacing: 1.5, fontWeight: 800, padding: "0 10px", margin: "12px 0" }, navActive: { padding: "12px 13px", borderRadius: 10, background: "#23324a", fontWeight: 700, fontSize: 13, marginBottom: 24 }, groupButton: { display: "flex", alignItems: "center", gap: 10, background: "transparent", border: 0, color: "#d5dceb", textAlign: "left", padding: "9px 10px", borderRadius: 9, cursor: "pointer", fontSize: 13 }, groupSelected: { background: "#263a51", color: "white" }, groupIcon: { width: 27, height: 27, display: "grid", placeItems: "center", borderRadius: 8, background: "#314760", fontSize: 11, fontWeight: 800 },
  newGroupForm: { display: "flex", gap: 6, margin: "12px 5px" }, smallInput: { minWidth: 0, width: "100%", background: "#1d2a40", color: "white", border: "1px solid #34435a", padding: "9px 8px", borderRadius: 8, outline: "none" }, addButton: { width: 36, border: 0, borderRadius: 8, background: "#54d6a0", color: "#102d28", fontSize: 20, cursor: "pointer" }, sidebarBottom: { display: "flex", alignItems: "center", gap: 10, marginTop: "auto", padding: "16px 6px 0", borderTop: "1px solid #29374c", fontSize: 12 }, avatar: { width: 34, height: 34, borderRadius: "50%", background: "#d9e9ff", color: "#1c4b80", display: "grid", placeItems: "center", fontWeight: 800 }, email: { display: "block", color: "#9aa8bc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 3, fontSize: 10 }, iconButton: { border: 0, background: "transparent", color: "#b8c5d7", cursor: "pointer", fontSize: 18 },
  main: { width: "100%", maxWidth: 1500, margin: "0 auto", padding: "34px clamp(18px, 4vw, 52px)", boxSizing: "border-box" }, header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, marginBottom: 28, flexWrap: "wrap" }, eyebrow: { fontSize: 10, fontWeight: 800, color: "#718096", letterSpacing: 1.7, margin: "0 0 8px" }, muted: { color: "#778397", fontSize: 12, margin: "6px 0 0" }, mutedSmall: { color: "#8290a3", fontSize: 11, margin: "5px 0 0" }, headerRight: { display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#778397" }, onlineDot: { width: 7, height: 7, borderRadius: "50%", background: "#28b67a" }, outlineButton: { marginLeft: 8, background: "white", border: "1px solid #dce3ed", borderRadius: 8, padding: "9px 12px", color: "#42506a", cursor: "pointer", fontWeight: 700 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 18 }, statCard: { background: "white", border: "1px solid #e7ecf3", borderRadius: 14, padding: "20px 21px", boxShadow: "0 2px 6px #17203305" }, statLabel: { fontSize: 10, color: "#78869a", fontWeight: 800, letterSpacing: 1, margin: 0 }, statHint: { color: "#8591a2", fontSize: 11, margin: "8px 0 0" }, contentGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 18, marginBottom: 18 }, panel: { background: "white", border: "1px solid #e7ecf3", borderRadius: 14, padding: 22, marginBottom: 18, boxShadow: "0 2px 6px #17203305", minWidth: 0 }, panelHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 20 }, panelIcon: { width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", color: "#16885d", background: "#e7f9f0", fontSize: 22 }, countPill: { padding: "6px 10px", borderRadius: 20, background: "#f1f5f9", color: "#627087", fontSize: 10, fontWeight: 800 }, expenseForm: { display: "grid", gap: 15 }, label: { display: "grid", gap: 7, fontSize: 11, color: "#526075", fontWeight: 700 }, input: { width: "100%", boxSizing: "border-box", border: "1px solid #dce3ed", background: "#fbfcfe", borderRadius: 9, padding: "12px 12px", fontSize: 12, color: "#172033", outlineColor: "#51c997" }, formRow: { display: "flex", gap: 12, flexWrap: "wrap" }, splitInfo: { borderRadius: 8, background: "#f2faf6", color: "#348362", padding: 11, fontSize: 11 }, primary: { display: "flex", justifyContent: "space-between", alignItems: "center", border: 0, borderRadius: 9, background: "#19a873", color: "white", fontWeight: 800, fontSize: 12, padding: "13px 16px", cursor: "pointer", width: "100%" },
  settlementList: { display: "grid", gap: 4 }, settlementItem: { display: "flex", alignItems: "center", gap: 10, padding: "13px 0", borderBottom: "1px solid #eef1f6" }, avatarSmall: { width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: "#edf4ff", color: "#2b5c9b", fontWeight: 800, fontSize: 12, flexShrink: 0 }, settleButton: { display: "block", marginTop: 6, background: "#e9f8f0", color: "#148255", border: 0, borderRadius: 6, padding: "6px 8px", fontSize: 10, fontWeight: 800, cursor: "pointer" }, footnote: { fontSize: 10, color: "#99a3b1", margin: "16px 0 0", lineHeight: 1.5 }, empty: { minHeight: 160, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 6 }, emptyIcon: { width: 38, height: 38, borderRadius: "50%", display: "grid", placeItems: "center", background: "#e9f8f0", color: "#159568", fontSize: 18, marginBottom: 6 },
  tableWrap: { overflowX: "auto" }, table: { width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left", whiteSpace: "nowrap" }, expenseName: { display: "flex", alignItems: "center", gap: 10, minWidth: 190 }, categoryIcon: { width: 35, height: 35, display: "grid", placeItems: "center", background: "#f0f5fb", borderRadius: 10, color: "#496583", fontSize: 15 }, deleteButton: { border: 0, borderRadius: 7, background: "#fff1f2", color: "#dc2626", fontSize: 18, width: 28, height: 28, cursor: "pointer" }, balanceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }, balancePerson: { display: "flex", alignItems: "center", gap: 10, border: "1px solid #edf0f5", padding: 12, borderRadius: 10, fontSize: 12 }, historyRow: { display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #edf0f5", padding: "12px 0", fontSize: 12 }, historyIcon: { width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", background: "#e9f8f0", color: "#15803d" }, footer: { color: "#8792a3", fontSize: 10, display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0 20px", flexWrap: "wrap" }, notice: { color: "#b45309", background: "#fffbeb", borderRadius: 8, padding: 10, fontSize: 12 }, noticeBar: { background: "#effaf4", border: "1px solid #c7eed9", color: "#17764e", padding: "10px 14px", borderRadius: 9, fontSize: 12, marginBottom: 16, display: "flex", justifyContent: "space-between" }, dismiss: { border: 0, background: "transparent", cursor: "pointer", color: "inherit", fontSize: 16 },
  authPage: { minHeight: "100vh", display: "grid", placeItems: "center", background: "radial-gradient(circle at top left, #e2f9ee, transparent 36%), #f5f8fc", padding: 20, fontFamily: "Inter, system-ui, sans-serif", color: "#172033" }, authCard: { width: "100%", maxWidth: 390, boxSizing: "border-box", background: "white", border: "1px solid #e6ecf3", borderRadius: 18, padding: 30, boxShadow: "0 18px 50px #1720330d", display: "grid", gap: 15 }, logo: { width: 43, height: 43, borderRadius: 13, background: "#19a873", color: "white", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 24 }, switch: { textAlign: "center", color: "#7b8798", fontSize: 12 }, link: { border: 0, background: "transparent", color: "#11875a", cursor: "pointer", fontWeight: 800 }
};
