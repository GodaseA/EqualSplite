import { useState } from 'react';
import api from '../../lib/api';
import { getErrorMessage } from '../../lib/api';
import Alert from '../../components/ui/Alert';
export default function GroupForm({ onCreated, onCancel }) {
  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (event) => { event.preventDefault(); setError(''); setBusy(true); try { const { data } = await api.post('/groups', { name: name.trim(), description: description.trim() }); onCreated(data.group); } catch (e) { setError(getErrorMessage(e, 'Could not create group.')); } finally { setBusy(false); } };
  return <form className="stack-form" onSubmit={submit}><Alert>{error}</Alert><label>Group name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apartment 4B" maxLength={80} required autoFocus/></label><label>What is this group for? <span className="optional">Optional</span><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Trip, flatmates, dinner club…" maxLength={140}/></label><div className="form-actions"><button type="button" className="button button--secondary" onClick={onCancel}>Cancel</button><button className="button button--primary" disabled={busy}>{busy ? 'Creating…' : 'Create group →'}</button></div></form>;
}
