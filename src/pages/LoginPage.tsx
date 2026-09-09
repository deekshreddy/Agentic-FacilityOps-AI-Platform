import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid work email address.');
      return;
    }
    if (!password) {
      setError('Enter your password to continue.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password, rememberMe);
      navigate('/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#080e1c] px-4 py-10 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(37,99,235,0.18),transparent_32%),radial-gradient(circle_at_85%_85%,rgba(16,185,129,0.1),transparent_30%)]" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d172b]/90 shadow-2xl shadow-black/40 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden border-r border-white/10 bg-blue-500/[0.04] p-12 lg:flex lg:flex-col lg:justify-between">
          <Brand />
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-blue-300">Operational intelligence</p>
            <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">See every facility clearly. Act before issues escalate.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-400">Bring energy, maintenance, occupancy, and security signals into one calm operating view.</p>
          </div>
          <p className="text-xs text-slate-500">FacilityOps AI Platform</p>
        </div>

        <div className="p-7 sm:p-10 lg:p-12">
          <div className="mb-9 lg:hidden"><Brand /></div>
          <div className="mb-8">
            <p className="text-sm font-medium text-blue-300">Facility operations workspace</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-400">Sign in to continue to your command center.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FieldLabel label="Work email" htmlFor="login-email" icon={<Mail className="h-4 w-4" />}>
              <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" className="auth-input" />
            </FieldLabel>
            <FieldLabel label="Password" htmlFor="login-password" icon={<LockKeyhole className="h-4 w-4" />}>
              <div className="relative">
                <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" className="auth-input pr-12" />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </FieldLabel>

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex items-center gap-2 text-slate-400">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-blue-300 hover:text-blue-200">Forgot password?</Link>
            </div>

            {error && <Message tone="error">{error}</Message>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">New to FacilityOps? <Link to="/register" className="font-medium text-blue-300 hover:text-blue-200">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
};

const Brand = () => <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300"><Building2 className="h-6 w-6" /></div><div><p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">FacilityOps</p><p className="text-lg font-bold">AI Platform</p></div></div>;
const FieldLabel = ({ label, htmlFor, icon, children }: { label: string; htmlFor: string; icon: React.ReactNode; children: React.ReactNode }) => <label htmlFor={htmlFor} className="block"><span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">{icon}{label}</span>{children}</label>;
const Message = ({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) => <div className={`rounded-xl border px-4 py-3 text-sm ${tone === 'error' ? 'border-red-400/20 bg-red-500/10 text-red-200' : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'}`}>{children}</div>;

export default LoginPage;
