import React from 'react';
import { initials } from '../utils/format';
export default function Avatar({ name, image, size = 'md' }) {
  return image ? <img className={`avatar avatar-${size}`} src={image} alt={`${name || 'User'} profile`} /> : <span className={`avatar avatar-${size}`}>{initials(name)}</span>;
}
