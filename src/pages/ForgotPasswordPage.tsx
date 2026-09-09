import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userExists } from '../services/authService';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPasswordPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');
    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!userExists(email)) {
      setError('No FacilityOps account was found for that email.');
      return;
    }
    setMessage('This frontend demo found your account. A real email reset is not sent by this local-only implementation.');
  };

  return <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#080e1c] px-4 py-10 text-white"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(37,99,235,0.18),transparent_32%),radial-gradient(circle_at_80%_85%,rgba(16,185,129,0.1),transparent_30%)]" /><section className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d172b]/95 p-7 shadow-2xl shadow-black/40 sm:p-10"><Brand /><div className="mb-8 mt-12"><p className="text-sm font-medium text-blue-300">Account recovery</p><h1 className="mt-2 text-3xl font-semibold">Reset your password</h1><p className="mt-2 text-sm leading-6 text-slate-400">Enter your account email to check recovery availability for this local frontend implementation.</p></div><form onSubmit={handleSubmit} className="space-y-5" noValidate><label htmlFor="forgot-email" className="block"><span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300"><Mail className="h-4 w-4" />Work email</span><input id="forgot-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" className="auth-input" /></label>{error && <Message tone="error">{error}</Message>}{message && <Message tone="success"><CheckCircle2 className="mr-2 inline h-4 w-4" />{message}</Message>}<button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3.5 text-sm font-semibold shadow-lg shadow-blue-500/20 transition hover:bg-blue-400">Check account <ArrowLeft className="h-4 w-4 rotate-180" /></button></form><Link to="/login" className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"><ArrowLeft className="h-4 w-4" />Back to sign in</Link></section></main>;
};

const Brand = () => <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300"><Building2 className="h-6 w-6" /></div><div><p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">FacilityOps</p><p className="text-lg font-bold">AI Platform</p></div></div>;
const Message = ({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) => <div className={`rounded-xl border px-4 py-3 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-200' : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'}`}>{children}</div>;

export default ForgotPasswordPage;
