import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password);
      navigate('/');
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(
        detail ?? 'Could not create account. The email might already be registered or is invalid.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex items-center justify-center bg-surface-dark py-12 px-4 sm:px-6 lg:px-8">
      {/* Blueprint Grid Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(var(--color-text-muted) 1px, transparent 1px), linear-gradient(90deg, var(--color-text-muted) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] bg-white border-2 border-surface-lighter rounded-2xl p-8 sm:p-10 shadow-[6px_6px_0px_rgba(26,29,32,0.04)]">
        {/* Brand Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white border border-primary-dark shadow-[2px_2px_0px_rgba(26,29,32,0.1)]">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-text">LearnTube</h2>
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mt-1">AI-Powered Video Companion</p>
        </div>

        {/* Page Title */}
        <div className="mb-6 border-b border-surface-light pb-4">
          <h1 className="text-lg font-bold text-text tracking-tight">Create Account</h1>
          <p className="text-xs text-text-muted mt-1 font-medium">Start compiling study materials for free.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label htmlFor="signup-email" className="mb-1.5 block text-[10px] font-extrabold text-text uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full rounded-lg border-2 border-surface-light bg-white py-2.5 pl-10 pr-4 text-xs text-text placeholder-text-dim outline-none transition-colors focus:border-primary font-semibold"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="signup-password" className="block text-[10px] font-extrabold text-text uppercase tracking-widest">
                Password
              </label>
              <span className="text-[10px] text-text-dim font-semibold">min. 8 chars</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full rounded-lg border-2 border-surface-light bg-white py-2.5 pl-10 pr-10 text-xs text-text placeholder-text-dim outline-none transition-colors focus:border-primary font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50/50 px-3.5 py-2.5 text-[11px] font-bold text-red-700 leading-normal">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary hover:bg-primary-dark border border-primary-dark py-2.5 text-xs font-bold text-white shadow-[2px_2px_0px_rgba(26,29,32,0.1)] transition-all duration-150 disabled:opacity-60 cursor-pointer hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_rgba(26,29,32,0.15)] active:translate-y-[0px] active:shadow-[1px_1px_0px_rgba(26,29,32,0.1)]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Register</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Form toggle */}
        <div className="mt-6 pt-5 border-t border-surface-light text-center">
          <p className="text-xs text-text-muted font-semibold">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="text-primary font-bold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
