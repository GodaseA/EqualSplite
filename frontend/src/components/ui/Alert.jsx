export default function Alert({ type = 'error', children, onClose }) {
  if (!children) return null;
  return <div className={`alert alert--${type}`} role="status"><span>{children}</span>{onClose && <button className="alert__close" onClick={onClose} aria-label="Dismiss">×</button>}</div>;
}
