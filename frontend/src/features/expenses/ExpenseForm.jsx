import { useMemo, useState } from 'react';
import api, { getErrorMessage } from '../../lib/api';
import { formatCurrency, getId } from '../../lib/format';
import Alert from '../../components/ui/Alert';

const CATEGORIES = ['food', 'travel', 'hotel', 'shopping', 'entertainment', 'utilities', 'other'];
const SPLIT_METHODS = [
  { value: 'equal', label: 'Equally', description: 'Split the expense evenly between selected members.' },
  { value: 'exact', label: 'Exact amounts', description: 'Enter the exact amount each member is responsible for.' },
  { value: 'percentage', label: 'By percentage', description: 'Choose each member’s percentage of the total.' },
];
const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

function getInitialAllocations(members, amount, splitType) {
  const total = Number(amount) || 0;
  if (!members.length) return {};
  if (splitType === 'percentage') {
    const share = 100 / members.length;
    return Object.fromEntries(members.map((member, index) => [
      getId(member), index === members.length - 1 ? roundMoney(100 - share * (members.length - 1)) : roundMoney(share),
    ]));
  }
  const share = total / members.length;
  return Object.fromEntries(members.map((member, index) => [
    getId(member), index === members.length - 1 ? roundMoney(total - share * (members.length - 1)) : roundMoney(share),
  ]));
}

export default function ExpenseForm({ group, onCreated, onCancel }) {
  const members = group?.members || [];
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'food',
    splitType: 'equal',
    payer: getId(members[0]),
    notes: '',
  });
  const [participantIds, setParticipantIds] = useState(() => members.map(getId));
  const [allocations, setAllocations] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedMembers = useMemo(
    () => members.filter((member) => participantIds.includes(getId(member))),
    [members, participantIds],
  );
  const amount = Number(form.amount) || 0;
  const allocationDefaults = useMemo(
    () => getInitialAllocations(selectedMembers, amount, form.splitType),
    [selectedMembers, amount, form.splitType],
  );
  const getAllocation = (memberId) => {
    if (Object.prototype.hasOwnProperty.call(allocations, memberId)) return allocations[memberId];
    return allocationDefaults[memberId] ?? '';
  };
  const allocationTotal = selectedMembers.reduce(
    (total, member) => total + (Number(getAllocation(getId(member))) || 0),
    0,
  );
  const expectedTotal = form.splitType === 'percentage' ? 100 : amount;
  const difference = roundMoney(expectedTotal - allocationTotal);
  const allocationIsValid = form.splitType === 'equal'
    || (form.splitType === 'percentage'
      ? Math.abs(difference) < 0.01
      : Math.abs(difference) < 0.01);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (name === 'splitType') setAllocations({});
  };

  const toggleParticipant = (memberId) => {
    setParticipantIds((current) => current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId]);
    setAllocations((current) => {
      const next = { ...current };
      delete next[memberId];
      return next;
    });
  };

  const updateAllocation = (memberId, value) => {
    setAllocations((current) => ({ ...current, [memberId]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const totalAmount = roundMoney(amount);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      setError('Enter an expense amount greater than zero.');
      return;
    }
    if (selectedMembers.length === 0) {
      setError('Select at least one member to split this expense with.');
      return;
    }
    if (!form.payer || !members.some((member) => getId(member) === form.payer)) {
      setError('Choose who paid for this expense.');
      return;
    }

    let splits;
    if (form.splitType === 'equal') {
      splits = selectedMembers.map((member) => ({ user: getId(member) }));
    } else if (form.splitType === 'exact') {
      splits = selectedMembers.map((member) => ({
        user: getId(member),
        amount: roundMoney(getAllocation(getId(member))),
      }));
      const splitTotal = roundMoney(splits.reduce((sum, split) => sum + split.amount, 0));
      if (splits.some((split) => !Number.isFinite(split.amount) || split.amount < 0)) {
        setError('Each member’s amount must be zero or greater.');
        return;
      }
      if (Math.abs(splitTotal - totalAmount) >= 0.01) {
        setError(`Exact amounts must add up to ${formatCurrency(totalAmount)}. Current total: ${formatCurrency(splitTotal)}.`);
        return;
      }
    } else {
      splits = selectedMembers.map((member) => ({
        user: getId(member),
        percentage: Number(getAllocation(getId(member))),
      }));
      const percentageTotal = roundMoney(splits.reduce((sum, split) => sum + split.percentage, 0));
      if (splits.some((split) => !Number.isFinite(split.percentage) || split.percentage < 0 || split.percentage > 100)) {
        setError('Each percentage must be between 0 and 100.');
        return;
      }
      if (Math.abs(percentageTotal - 100) >= 0.01) {
        setError(`Percentages must add up to 100%. Current total: ${percentageTotal}%.`);
        return;
      }
    }

    const payload = {
      groupId: getId(group),
      description: form.description.trim(),
      amount: totalAmount,
      category: form.category,
      splitType: form.splitType,
      paidBy: [{ user: form.payer, amount: totalAmount }],
      splits,
      notes: form.notes.trim(),
    };

    setBusy(true);
    try {
      const { data } = await api.post('/expenses', payload);
      onCreated(data.expense);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not save this expense.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="stack-form expense-form" onSubmit={submit}>
      <Alert>{error}</Alert>

      <label>
        What was this for?
        <input
          name="description"
          value={form.description}
          onChange={updateField}
          placeholder="Dinner, groceries, cab…"
          required
          maxLength={120}
        />
      </label>

      <div className="form-grid">
        <label>
          Total amount (₹)
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={updateField}
            placeholder="0.00"
            required
          />
        </label>
        <label>
          Category
          <select name="category" value={form.category} onChange={updateField}>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category[0].toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Paid by
        <select name="payer" value={form.payer} onChange={updateField} required>
          {members.map((member) => (
            <option key={getId(member)} value={getId(member)}>
              {member.name || member.email || getId(member)}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="split-method-fieldset">
        <legend>How should this expense be split?</legend>
        <div className="split-method-options">
          {SPLIT_METHODS.map((method) => (
            <label className={`split-method-option ${form.splitType === method.value ? 'split-method-option--active' : ''}`} key={method.value}>
              <input
                type="radio"
                name="splitType"
                value={method.value}
                checked={form.splitType === method.value}
                onChange={updateField}
              />
              <span className="split-method-option__content">
                <strong>{method.label}</strong>
                <small>{method.description}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <section className="split-members-section">
        <div className="split-section-heading">
          <div>
            <h3>Split between</h3>
            <p className="muted">Choose the members responsible for this expense.</p>
          </div>
          <span className="count-badge">{selectedMembers.length} selected</span>
        </div>

        {members.length === 0 ? (
          <p className="inline-note">Add members to this group before creating an expense.</p>
        ) : (
          <div className="split-member-list">
            {members.map((member) => {
              const memberId = getId(member);
              const selected = participantIds.includes(memberId);
              return (
                <div className={`split-member-row ${selected ? 'split-member-row--selected' : ''}`} key={memberId}>
                  <label className="split-member-check">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleParticipant(memberId)}
                    />
                    <span className="split-member-avatar">{(member.name || member.email || '?').slice(0, 1).toUpperCase()}</span>
                    <span className="split-member-identity">
                      <strong>{member.name || 'Group member'}</strong>
                      <small>{member.email || 'Member'}</small>
                    </span>
                  </label>

                  {selected && form.splitType !== 'equal' && (
                    <label className="split-allocation-field">
                      <span>{form.splitType === 'exact' ? '₹' : '%'}</span>
                      <input
                        aria-label={`${form.splitType === 'exact' ? 'Amount' : 'Percentage'} for ${member.name || member.email || 'member'}`}
                        type="number"
                        min="0"
                        max={form.splitType === 'percentage' ? '100' : undefined}
                        step={form.splitType === 'exact' ? '0.01' : '0.01'}
                        value={getAllocation(memberId)}
                        onChange={(event) => updateAllocation(memberId, event.target.value)}
                        required
                      />
                    </label>
                  )}
                  {selected && form.splitType === 'equal' && amount > 0 && (
                    <span className="split-equal-share">{formatCurrency(amount / selectedMembers.length || 0)}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {form.splitType !== 'equal' && selectedMembers.length > 0 && (
          <div className={`split-total-summary ${allocationIsValid ? 'split-total-summary--valid' : 'split-total-summary--invalid'}`}>
            <span>{form.splitType === 'exact' ? 'Allocated amount' : 'Allocated percentage'}</span>
            <strong>
              {form.splitType === 'exact'
                ? `${formatCurrency(allocationTotal)} / ${formatCurrency(amount)}`
                : `${roundMoney(allocationTotal)}% / 100%`}
            </strong>
            <small>
              {allocationIsValid
                ? 'The split adds up correctly.'
                : form.splitType === 'exact'
                  ? `${formatCurrency(Math.abs(difference))} ${difference > 0 ? 'left to allocate' : 'over-allocated'}`
                  : `${Math.abs(difference)}% ${difference > 0 ? 'left to allocate' : 'over-allocated'}`}
            </small>
          </div>
        )}
      </section>

      <label>
        Note <span className="optional">Optional</span>
        <textarea
          name="notes"
          value={form.notes}
          onChange={updateField}
          rows={2}
          placeholder="Add a little context…"
        />
      </label>

      <div className="form-actions">
        <button type="button" className="button button--secondary" onClick={onCancel}>Cancel</button>
        <button className="button button--primary" disabled={busy || members.length === 0 || selectedMembers.length === 0}>
          {busy ? 'Saving…' : 'Add expense →'}
        </button>
      </div>
    </form>
  );
}
