import { Link } from 'react-router-dom';
export default function NotFoundPage() { return <main className="not-found"><span className="brand__mark">s.</span><p className="eyebrow">404 · WRONG TURN</p><h1>This page isn't in the group.</h1><p className="muted">The link may be outdated, or this page may have moved.</p><Link to="/" className="button button--primary">Back to overview →</Link></main>; }
