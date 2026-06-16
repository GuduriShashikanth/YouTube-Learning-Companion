import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Tab = 'signin' | 'signup';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/');
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(
        detail ??
          (tab === 'signin'
            ? 'Invalid email or password.'
            : 'Could not create account. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Background orbs — matching app.tsx */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="animate-float-slow absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)' }}
        />
        <div
          className="animate-float absolute -right-24 top-1/3 h-80 w-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)', animationDelay: '2s' }}
        />
        <div
          className="animate-float-slow absolute bottom-0 left-1/3 h-72 w-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)', animationDelay: '4s' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Card */}
      <div className="glass-strong animate-fade-in-up relative z-10 w-full max-w-md rounded-2xl p-8 shadow-2xl">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/30">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">
            <span className="gradient-text">LearnTube</span>
          </h1>
          <p className="mt-1 text-sm text-text-muted">AI-Powered Video Learning</p>
        </div>

        {/* Tab Toggle */}
        <div className="mb-6 flex rounded-xl border border-surface-light/40 bg-surface-dark/30 p-1">
          {(['signin', 'signup'] as Tab[]).map((t) => (
            <button
              key={t}
              id={`auth-tab-${t}`}
              onClick={() => switchTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
                tab === t
                  ? 'bg-primary text-white shadow-md'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {t === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Tagline */}
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-primary-light" />
          <p className="text-xs text-text-muted">
            {tab === 'signin'
              ? 'Welcome back — your videos and progress are waiting.'
              : 'Create an account to save your video library and study materials.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-text-muted">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-surface-light/40 bg-surface-dark/40 py-2.5 pl-10 pr-4 text-sm text-text placeholder-text-dim outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium text-text-muted">
              Password {tab === 'signup' && <span className="text-text-dim">(min. 8 characters)</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={tab === 'signup' ? 8 : 1}
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                className="w-full rounded-xl border border-surface-light/40 bg-surface-dark/40 py-2.5 pl-10 pr-11 text-sm text-text placeholder-text-dim outline-none transition-all focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
              <button
                type="button"
                id="auth-toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-muted transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl gradient-primary py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-200 hover:opacity-90 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {tab === 'signin' ? 'Sign In' : 'Create Account'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Switch link */}
        <p className="mt-6 text-center text-xs text-text-dim">
          {tab === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                id="auth-switch-to-signup"
                onClick={() => switchTab('signup')}
                className="text-primary-light hover:underline"
              >
                Sign up for free
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                id="auth-switch-to-signin"
                onClick={() => switchTab('signin')}
                className="text-primary-light hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
