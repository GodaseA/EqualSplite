import { getInitials } from '../../lib/format';
export default function Avatar({ name, image, size = 'md' }) {
  return <span className={`avatar avatar--${size}`}>{image ? <img src={image} alt={`${name || 'User'} profile`} /> : getInitials(name)}</span>;
}
