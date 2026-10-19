import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import Avatar from '../ui/Avatar';

const navItems = [
  { to: '/', label: 'Overview', icon: '◫', end: true },
  { to: '/groups', label: 'Your groups', icon: '▦' },
  { to: '/profile', label: 'My profile', icon: '◎' },
];
export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => { logout(); navigate('/login', { replace: true }); };
  return <aside className="sidebar"><NavLink to="/" className="brand" onClick={onNavigate}><span className="brand__mark">s.</span><span>settle<span className="brand__accent">mate</span><small>EXPENSES, SIMPLIFIED</small></span></NavLink>
    <div className="sidebar__label">WORKSPACE</div><nav className="sidebar__nav">{navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}><span className="nav-link__icon">{item.icon}</span>{item.label}</NavLink>)}</nav>
    <div className="sidebar__bottom"><div className="sidebar__tip"><span>✳</span><strong>Good friends, clear balances.</strong><p>Keep shared spending simple and transparent.</p></div><button className="user-chip" onClick={() => navigate('/profile')}><Avatar name={user?.name} image={user?.profileImage}/><span className="user-chip__text"><strong>{user?.name || 'Your account'}</strong><small>{user?.email || ''}</small></span><span className="user-chip__arrow">↗</span></button><button className="logout-button" onClick={signOut}>↪ <span>Log out</span></button></div>
  </aside>;
}
