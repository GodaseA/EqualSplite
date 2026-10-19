import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
const pageTitles = { '/': 'Overview', '/groups': 'Your groups', '/profile': 'My profile' };
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isGroup = location.pathname.startsWith('/groups/');
  const title = isGroup ? 'Group details' : pageTitles[location.pathname] || 'Workspace';
  return <div className="app-shell"><div className={`sidebar-wrap ${menuOpen ? 'sidebar-wrap--open' : ''}`}><Sidebar onNavigate={() => setMenuOpen(false)} /></div>{menuOpen && <button className="mobile-scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu"/>}<main className="main-area"><header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMenuOpen((value) => !value)} aria-label="Toggle menu">☰</button><div><span className="topbar__eyebrow">YOUR MONEY, TOGETHER</span><h1>{title}</h1></div><div className="topbar__right"><span className="status-dot"/> All balances up to date</div></header><div className="page-content"><Outlet /></div><footer className="app-footer">Made for better shared moments <span>✳</span></footer></main></div>;
}
