import { Link } from 'react-router-dom';
import { getId } from '../../lib/format';
const palettes = ['mint', 'lilac', 'peach', 'blue'];
export default function GroupCard({ group, index = 0 }) {
  const members = Array.isArray(group.members) ? group.members : [];
  return <Link to={`/groups/${getId(group)}`} className="group-card"><div className={`group-card__icon group-card__icon--${palettes[index % palettes.length]}`}>{(group.name || 'G').trim().slice(0, 1).toUpperCase()}</div><div className="group-card__body"><h3>{group.name}</h3><p>{members.length} {members.length === 1 ? 'member' : 'members'} <span>·</span> Created {group.createdAt ? new Date(group.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'recently'}</p></div><span className="group-card__arrow">↗</span></Link>;
}
