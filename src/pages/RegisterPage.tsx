import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegisterPage = () => {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) return setError('Enter your full name.');
    if (!emailPattern.test(email.trim())) return setError('Enter a valid work email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await register(name, email, password);
      setSuccess('Your account is ready. Taking you to sign in...');
      window.setTimeout(() => navigate('/login', { replace: true }), 1000);
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#080e1c] px-4 py-10 text-white"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(37,99,235,0.18),transparent_32%),radial-gradient(circle_at_85%_85%,rgba(16,185,129,0.1),transparent_30%)]" /><section className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#0d172b]/95 p-7 shadow-2xl shadow-black/40 sm:p-10"><Brand /><div className="mb-8 mt-10"><p className="text-sm font-medium text-blue-300">Set up your workspace access</p><h1 className="mt-2 text-3xl font-semibold">Create your account</h1><p className="mt-2 text-sm text-slate-400">Start managing your facilities from one intelligent operating view.</p></div><form onSubmit={handleSubmit} className="space-y-5" noValidate><FieldLabel label="Full name" htmlFor="register-name" icon={<UserRound className="h-4 w-4" />}><input id="register-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jordan Lee" autoComplete="name" className="auth-input" /></FieldLabel><FieldLabel label="Work email" htmlFor="register-email" icon={<Mail className="h-4 w-4" />}><input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" className="auth-input" /></FieldLabel><FieldLabel label="Password" htmlFor="register-password" icon={<LockKeyhole className="h-4 w-4" />}><PasswordInput id="register-password" value={password} showPassword={showPasswords} onChange={setPassword} onToggle={() => setShowPasswords((visible) => !visible)} autoComplete="new-password" /></FieldLabel><FieldLabel label="Confirm password" htmlFor="confirm-password" icon={<LockKeyhole className="h-4 w-4" />}><PasswordInput id="confirm-password" value={confirmPassword} showPassword={showPasswords} onChange={setConfirmPassword} onToggle={() => setShowPasswords((visible) => !visible)} autoComplete="new-password" /></FieldLabel><p className="text-xs text-slate-500">Use at least 8 characters. Your password is stored only as a secure hash in this browser.</p>{error && <Message tone="error">{error}</Message>}{success && <Message tone="success"><CheckCircle2 className="mr-2 inline h-4 w-4" />{success}</Message>}<button type="submit" disabled={loading || Boolean(success)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3.5 text-sm font-semibold shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}</button></form><p className="mt-8 text-center text-sm text-slate-400">Already have an account? <Link to="/login" className="font-medium text-blue-300 hover:text-blue-200">Sign in</Link></p></section></main>;
};

const Brand = () => <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300"><Building2 className="h-6 w-6" /></div><div><p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">FacilityOps</p><p className="text-lg font-bold">AI Platform</p></div></div>;
const FieldLabel = ({ label, htmlFor, icon, children }: { label: string; htmlFor: string; icon: React.ReactNode; children: React.ReactNode }) => <label htmlFor={htmlFor} className="block"><span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">{icon}{label}</span>{children}</label>;
const PasswordInput = ({ id, value, showPassword, onChange, onToggle, autoComplete }: { id: string; value: string; showPassword: boolean; onChange: (value: string) => void; onToggle: () => void; autoComplete: string }) => <div className="relative"><input id={id} type={showPassword ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} placeholder="At least 8 characters" autoComplete={autoComplete} className="auth-input pr-12" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>;
const Message = ({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) => <div className={`rounded-xl border px-4 py-3 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-200' : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'}`}>{children}</div>;

export default RegisterPage;
