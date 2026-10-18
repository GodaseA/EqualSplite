import React from 'react';
export default function StatCard({ label, value, note, icon, tone = 'default' }) {
  return <article className="stat-card"><div className="stat-top"><span className="stat-label">{label}</span><span className={`stat-icon ${tone}`}>{icon}</span></div><div className={`stat-value ${tone}`}>{value}</div><p className="stat-note">{note}</p></article>;
}
