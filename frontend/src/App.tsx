import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { type ReactNode } from 'react';
import HomePage from './pages/HomePage';
import VideoPage from './pages/VideoPage';
import AuthPage from './pages/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// ─── Protected route wrapper ─────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // Avoid flash of redirect while we read localStorage
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />;
}

// ─── Header with auth controls ───────────────────────────────────────

function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/auth');
  };

  return (
    <header className="glass-strong sticky top-0 z-50 rounded-none border-t-0 border-x-0 bg-opacity-95">
      <div className="mx-auto flex max-w-none items-center justify-between px-4 py-3 md:px-8 lg:px-12">
        <Link to="/" className="group flex items-center gap-3">
          <div className="bg-[#E11D48] flex h-9 w-9 items-center justify-center rounded-xl shadow-md transition-transform duration-300 group-hover:scale-110">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-text">
              <span className="gradient-text">LearnTube</span>
            </h1>
            <p className="hidden text-[11px] leading-none text-text-muted sm:block">
              AI-Powered Video Learning
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              {/* User info pill */}
              <div className="hidden items-center gap-2 rounded-lg border border-surface-light/30 bg-surface-dark/30 px-3 py-1.5 sm:flex">
                <User className="h-3.5 w-3.5 text-text-dim" />
                <span className="max-w-[160px] truncate text-xs text-text-muted">
                  {user.email}
                </span>
              </div>
              {/* Sign out */}
              <button
                id="header-signout-btn"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-text-muted transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-muted transition-all duration-200 hover:bg-surface-light/50 hover:text-text"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

// ─── App shell ───────────────────────────────────────────────────────

function AppShell() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="animate-float-slow absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle, rgba(225,29,72,0.03) 0%, transparent 70%)',
          }}
        />
        <div
          className="animate-float absolute -right-24 top-1/3 h-80 w-80 rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle, rgba(254,243,199,0.06) 0%, transparent 70%)',
            animationDelay: '2s',
          }}
        />
        <div
          className="animate-float-slow absolute bottom-0 left-1/3 h-72 w-72 rounded-full opacity-15"
          style={{
            background:
              'radial-gradient(circle, rgba(100,116,139,0.02) 0%, transparent 70%)',
            animationDelay: '4s',
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(100,116,139,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.2) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <AppHeader />

      {/* Main Content */}
      <main className="relative z-10">
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/video/:videoId"
            element={
              <ProtectedRoute>
                <VideoPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-16 border-t border-surface-light/30 py-8 text-center text-sm text-text-dim">
        <p>YouTube Learning Companion &middot; Transform videos into knowledge</p>
      </footer>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

export default App;
