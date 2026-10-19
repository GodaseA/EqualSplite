import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getErrorMessage } from '../../lib/api';
import Alert from '../../components/ui/Alert';
export default function AuthForm() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const isRegister = mode === 'register';
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { if (isRegister) await register({ name: form.name.trim(), email: form.email.trim(), password: form.password }); else await login({ email: form.email.trim(), password: form.password }); navigate('/', { replace: true }); }
    catch (requestError) { setError(getErrorMessage(requestError, 'Unable to sign in. Please try again.')); }
    finally { setSubmitting(false); }
  };
  return <form className="auth-form" onSubmit={submit}><Alert>{error}</Alert>{isRegister && <label>Full name<input name="name" value={form.name} onChange={update} placeholder="e.g. Mauli Godase" autoComplete="name" required maxLength={80}/></label>}<label>Email address<input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" required/></label><label>Password<input name="password" type="password" value={form.password} onChange={update} placeholder="At least 6 characters" minLength={6} autoComplete={isRegister ? 'new-password' : 'current-password'} required/></label><button className="button button--primary button--wide" type="submit" disabled={submitting}>{submitting ? 'Please wait…' : isRegister ? 'Create your account →' : 'Sign in to workspace →'}</button><p className="auth-form__switch">{isRegister ? 'Already have an account?' : 'New to SettleMate?'} <button type="button" onClick={() => { setMode(isRegister ? 'login' : 'register'); setError(''); }}>{isRegister ? 'Sign in' : 'Create an account'}</button></p></form>;
}
