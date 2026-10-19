import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../lib/api';
import { safeArray } from '../lib/format';
import GroupCard from '../features/groups/GroupCard';
import GroupForm from '../features/groups/GroupForm';
import Modal from '../components/ui/Modal';
import Alert from '../components/ui/Alert';
export default function GroupsPage() {
  const [groups, setGroups] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [showForm, setShowForm] = useState(false); const [query, setQuery] = useState('');
  const load = async () => { try { const { data } = await api.get('/groups'); setGroups(safeArray(data.groups)); } catch (e) { setError(getErrorMessage(e, 'Could not load groups.')); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const filtered = groups.filter((group) => (group.name || '').toLowerCase().includes(query.toLowerCase()));
  return <div className="page-stack"><section className="page-intro"><div><p className="eyebrow">BETTER TOGETHER</p><h2>Your groups, all in one place.</h2><p className="muted">Keep every trip, household, and shared plan organised.</p></div><button className="button button--primary" onClick={() => setShowForm(true)}>＋ Create group</button></section><Alert>{error}</Alert><div className="toolbar"><div className="search-field"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your groups…" aria-label="Search groups"/></div><span className="muted">{filtered.length} {filtered.length === 1 ? 'group' : 'groups'}</span></div>{loading ? <div className="empty-state"><span className="spinner"/><p>Loading groups…</p></div> : filtered.length ? <div className="groups-grid">{filtered.map((group,index) => <GroupCard key={group._id} group={group} index={index}/>)}</div> : <div className="empty-state empty-state--large"><span className="empty-state__icon">▦</span><h3>{query ? 'No matching groups' : 'Nothing shared just yet'}</h3><p>{query ? 'Try a different group name.' : 'Create your first group and start sharing expenses fairly.'}</p>{!query && <button className="button button--primary" onClick={() => setShowForm(true)}>Create your first group</button>}</div>}{showForm && <Modal title="Create a new group" onClose={() => setShowForm(false)}><GroupForm onCreated={(group) => { setGroups((items) => [group, ...items]); setShowForm(false); }} onCancel={() => setShowForm(false)}/></Modal>}</div>;
}
