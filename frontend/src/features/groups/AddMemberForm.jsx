import { useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../../lib/api';
import { getId, safeArray } from '../../lib/format';
import Alert from '../../components/ui/Alert';
import Avatar from '../../components/ui/Avatar';

/** Search registered users and add one to the current group. */
export default function AddMemberForm({ group, onAdded, onCancel }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const existingIds = useMemo(
    () => new Set(safeArray(group?.members).map((member) => getId(member))),
    [group?.members],
  );

  useEffect(() => {
    let cancelled = false;
    const term = query.trim();
    setError('');
    setMessage('');

    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    api.get('/users/search', { params: { q: term } })
      .then(({ data }) => {
        if (!cancelled) setResults(safeArray(data.users));
      })
      .catch((requestError) => {
        if (!cancelled) setError(getErrorMessage(requestError, 'Could not search users.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [query]);

  async function addMember(user) {
    const userId = getId(user);
    setAddingId(userId);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post(`/groups/${getId(group)}/members`, { userId });
      setMessage(`${user.name || 'Member'} added to the group.`);
      if (data.group) await onAdded(data.group);
      else await onAdded();
      setQuery('');
      setResults([]);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not add this member.'));
    } finally {
      setAddingId('');
    }
  }

  return (
    <div className="stack-form">
      <p className="muted">Search by a registered member's name or email address, then add them to this group.</p>
      <Alert>{error}</Alert>
      {message && <p className="form-success" role="status">{message}</p>}
      <label>
        Search people
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Enter at least 2 characters…"
          autoFocus
        />
      </label>
      {loading && <p className="muted">Searching users…</p>}
      {!loading && query.trim().length >= 2 && results.length === 0 && !error && (
        <div className="empty-state"><p>No users found. Ask them to create an account first.</p></div>
      )}
      {results.length > 0 && (
        <div className="member-search-results">
          {results.map((user) => {
            const userId = getId(user);
            const alreadyMember = existingIds.has(userId);
            return (
              <div className="member-search-result" key={userId}>
                <Avatar name={user.name} image={user.profileImage} />
                <div className="member-search-result__identity">
                  <strong>{user.name || 'Unnamed user'}</strong>
                  <small>{user.email}</small>
                </div>
                {alreadyMember ? (
                  <span className="member-status">Already added</span>
                ) : (
                  <button
                    type="button"
                    className="button button--primary button--small"
                    onClick={() => addMember(user)}
                    disabled={Boolean(addingId)}
                  >
                    {addingId === userId ? 'Adding…' : '+ Add'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="form-actions">
        <button type="button" className="button button--secondary" onClick={onCancel}>Close</button>
      </div>
    </div>
  );
}
