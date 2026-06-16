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
          style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.03) 0%, transparent 70%)' }}
        />
        <div
          className="animate-float absolute -right-24 top-1/3 h-80 w-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(254,243,199,0.06) 0%, transparent 70%)', animationDelay: '2s' }}
        />
        <div
          className="animate-float-slow absolute bottom-0 left-1/3 h-72 w-72 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(100,116,139,0.02) 0%, transparent 70%)', animationDelay: '4s' }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(100,116,139,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.2) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Card */}
      <div className="glass-strong animate-fade-in-up relative z-10 w-full max-w-md bg-white border border-surface-light rounded-2xl p-8 shadow-xl">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E11D48] shadow-md shadow-red-100">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">
            <span className="text-[#E11D48]">LearnTube</span>
          </h1>
          <p className="mt-1 text-xs font-semibold text-text-muted">AI-Powered Video Learning</p>
        </div>

        {/* Tab Toggle */}
        <div className="mb-6 flex rounded-xl border border-surface-light bg-surface-dark bg-opacity-20 p-1">
          {(['signin', 'signup'] as Tab[]).map((t) => (
            <button
              key={t}
              id={`auth-tab-${t}`}
              onClick={() => switchTab(t)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200 ${
                tab === t
                  ? 'bg-[#E11D48] text-white shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {t === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Tagline */}
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/50 px-4 py-2.5">
          <Sparkles className="h-4 w-4 shrink-0 text-[#E11D48]" />
          <p className="text-xs font-semibold text-text-muted leading-relaxed">
            {tab === 'signin'
              ? 'Welcome back — your videos and progress are waiting.'
              : 'Create an account to save your video library and study materials.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-xs font-bold text-text uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-surface-light bg-white py-2.5 pl-10 pr-4 text-sm text-text placeholder-text-muted outline-none transition-all focus:border-[#E11D48] focus:ring-1 focus:ring-red-100 font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-xs font-bold text-text uppercase tracking-wider">
              Password {tab === 'signup' && <span className="text-text-muted font-medium lowercase">(min. 8 characters)</span>}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={tab === 'signup' ? 8 : 1}
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                className="w-full rounded-xl border border-surface-light bg-white py-2.5 pl-10 pr-11 text-sm text-text placeholder-text-muted outline-none transition-all focus:border-[#E11D48] focus:ring-1 focus:ring-red-100 font-medium"
              />
              <button
                type="button"
                id="auth-toggle-password"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-xs font-bold text-red-600">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 disabled:opacity-60"
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
        <p className="mt-6 text-center text-xs text-text-muted font-medium">
          {tab === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                id="auth-switch-to-signup"
                onClick={() => switchTab('signup')}
                className="text-[#E11D48] font-bold hover:underline"
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
                className="text-[#E11D48] font-bold hover:underline"
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
