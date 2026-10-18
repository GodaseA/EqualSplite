import React from 'react';
export default function Brand({ compact = false }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}><span className="brand-mark">s<span>+</span></span><span className="brand-name">split<span>wise</span><b>+</b></span></div>;
}
