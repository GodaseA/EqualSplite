export const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2,
}).format(Number(value || 0));

export const shortDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
}) : '—';

export const initials = (name = 'U') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
export const idOf = (value) => String(value?._id || value?.id || value || '');
export const categoryMeta = {
  food: { icon: '🍜', label: 'Food' }, travel: { icon: '✈️', label: 'Travel' },
  hotel: { icon: '🛏️', label: 'Stay' }, shopping: { icon: '🛍️', label: 'Shopping' },
  entertainment: { icon: '🎟️', label: 'Fun' }, other: { icon: '✳️', label: 'Other' },
};
