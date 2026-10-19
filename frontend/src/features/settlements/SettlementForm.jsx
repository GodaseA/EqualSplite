import { useState } from 'react';
import api, { getErrorMessage } from '../../lib/api';
import { getId } from '../../lib/format';
import Alert from '../../components/ui/Alert';
export default function SettlementForm({ group, suggested, onCreated, onCancel }) {
  const me = localStorage.getItem('expense_splitter_user'); let currentUserId = ''; try { currentUserId = JSON.parse(me || '{}').id || JSON.parse(me || '{}')._id || ''; } catch { /* no cached profile */ }
  const members = (group?.members || []).filter((member) => getId(member) !== currentUserId);
  const [form, setForm] = useState({ paidTo: suggested?.to?.user || getId(members[0]), amount: suggested?.amount ? String(suggested.amount) : '', note: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => { e.preventDefault(); setError(''); setBusy(true); try { const { data } = await api.post('/settlements', { groupId: getId(group), paidTo: form.paidTo, amount: Number(form.amount), note: form.note.trim() }); onCreated(data.settlement); } catch (requestError) { setError(getErrorMessage(requestError, 'Could not record settlement.')); } finally { setBusy(false); } };
  return <form className="stack-form" onSubmit={submit}><Alert>{error}</Alert><p className="inline-note">Record a payment you have already made. This does not transfer money automatically.</p><label>Paid to<select value={form.paidTo} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} required>{members.map((member) => <option key={getId(member)} value={getId(member)}>{member.name || member.email}</option>)}</select></label><label>Amount (₹)<input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required/></label><label>Note <span className="optional">Optional</span><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="UPI, cash, bank transfer…" maxLength={140}/></label><div className="form-actions"><button type="button" className="button button--secondary" onClick={onCancel}>Cancel</button><button className="button button--primary" disabled={busy || !members.length}>{busy ? 'Recording…' : 'Record settlement →'}</button></div></form>;
}
