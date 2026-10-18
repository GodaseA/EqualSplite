import React, { useCallback, useEffect, useState } from 'react';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import { api, errorMessage, setAuthToken } from './services/api';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('expense_token') || '');
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState('');
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => { setAuthToken(token); }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem('expense_token'); setAuthToken(''); setToken(''); setUser(null);
    setGroups([]); setGroupId(''); setGroup(null); setExpenses([]); setBalances(null); setSettlements([]);
  }, []);

  const loadInitial = useCallback(async () => {
    try {
      const [meResponse, groupsResponse] = await Promise.all([api.get('/auth/me'), api.get('/groups')]);
      setUser(meResponse.data.user);
      const nextGroups = groupsResponse.data.groups || [];
      setGroups(nextGroups);
      setGroupId((current) => nextGroups.some((item) => item._id === current) ? current : (nextGroups[0]?._id || ''));
    } catch (error) {
      setMessage(errorMessage(error, 'Your session has expired. Please sign in again.'));
      logout();
    }
  }, [logout]);

  const loadGroup = useCallback(async (id = groupId) => {
    if (!id) { setGroup(null); setExpenses([]); setBalances(null); setSettlements([]); return; }
    try {
      const [groupResponse, expenseResponse, balanceResponse, settlementResponse] = await Promise.all([
        api.get(`/groups/${id}`), api.get(`/expenses/group/${id}`), api.get(`/balances/group/${id}`), api.get(`/settlements/group/${id}`),
      ]);
      setGroup(groupResponse.data.group || null);
      setExpenses(expenseResponse.data.expenses || []);
      setBalances(balanceResponse.data || null);
      setSettlements(settlementResponse.data.settlements || []);
    } catch (error) { setMessage(errorMessage(error, 'Could not load group details.')); }
  }, [groupId]);

  useEffect(() => { if (token) loadInitial(); else { setUser(null); setGroups([]); } }, [token, loadInitial]);
  useEffect(() => { if (token && groupId) loadGroup(groupId); else { setGroup(null); setExpenses([]); setBalances(null); setSettlements([]); } }, [token, groupId, loadGroup]);

  async function submitAuth(form, mode) {
    setBusy(true); setMessage('');
    try {
      const { data } = await api.post(mode === 'login' ? '/auth/login' : '/auth/register', form);
      localStorage.setItem('expense_token', data.token); setAuthToken(data.token); setUser(data.user); setToken(data.token); setMessage('');
    } catch (error) { setMessage(errorMessage(error, 'Authentication failed.')); }
    finally { setBusy(false); }
  }

  async function createGroup(name) {
    try {
      const { data } = await api.post('/groups', { name });
      const created = data.group;
      setGroups((old) => [created, ...old.filter((item) => item._id !== created._id)]);
      setGroupId(created._id); setMessage('Your group is ready.');
    } catch (error) { setMessage(errorMessage(error, 'Could not create group.')); }
  }

  async function createExpense(form) {
    if (!group || !user) return;
    const payerId = user.id || user._id;
    const payload = {
      groupId, description: form.description.trim(), amount: Number(form.amount), splitType: form.splitType,
      paidBy: [{ user: payerId, amount: Number(form.amount) }], splits: form.splits,
      category: form.category, notes: form.notes,
    };
    try { await api.post('/expenses', payload); await loadGroup(groupId); setMessage('Expense added successfully.'); }
    catch (error) { setMessage(errorMessage(error, 'Could not add expense.')); return false; }
  }

  async function deleteExpense(id) {
    if (!window.confirm('Delete this expense? Group balances will be recalculated.')) return;
    try { await api.delete(`/expenses/${id}`); await loadGroup(groupId); setMessage('Expense deleted.'); }
    catch (error) { setMessage(errorMessage(error, 'Could not delete expense.')); }
  }

  async function recordSettlement(item) {
    if (!window.confirm(`Record ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.amount)} paid to ${item.to?.name}? This records a payment; it does not transfer money.`)) return;
    try {
      await api.post('/settlements', { groupId, paidTo: item.to.user, amount: item.amount, note: 'Settlement recorded from suggested settlement' });
      await loadGroup(groupId); setMessage('Settlement recorded.');
    } catch (error) { setMessage(errorMessage(error, 'Could not record settlement.')); }
  }

  async function addMember(userId) {
    if (!userId.trim()) return;
    try {
      const { data } = await api.post(`/groups/${groupId}/members`, { userId: userId.trim() });
      setGroup(data.group); setGroups((old) => old.map((item) => item._id === groupId ? data.group : item));
      await loadGroup(groupId); setMessage('Member added to the group.');
    } catch (error) { setMessage(errorMessage(error, 'Could not add member.')); }
  }

  if (!token || !user) return <AuthScreen onSubmit={submitAuth} busy={busy} message={message} />;
  return <div className="app-shell"><Sidebar user={user} groups={groups} groupId={groupId} onSelectGroup={setGroupId} onCreateGroup={createGroup} onLogout={logout} mobileOpen={mobileNav} onClose={() => setMobileNav(false)} /><main className="app-main"><div className="mobile-topbar"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation">☰</button><span>splitwise<b>+</b></span><button className="icon-button" onClick={() => loadGroup(groupId)} aria-label="Refresh">↻</button></div>{message && <div className="toast" role="status"><span>✳</span>{message}<button onClick={() => setMessage('')} aria-label="Dismiss notification">×</button></div>}<Dashboard user={user} groups={groups} groupId={groupId} group={group} expenses={expenses} balances={balances} settlements={settlements} onCreateExpense={createExpense} onDeleteExpense={deleteExpense} onRecordSettlement={recordSettlement} onRefresh={() => loadGroup(groupId)} onAddMember={addMember} /></main></div>;
}
