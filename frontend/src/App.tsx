import { Routes, Route } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import VideoPage from './pages/VideoPage';

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="animate-float-slow absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
          }}
        />
        <div
          className="animate-float absolute -right-24 top-1/3 h-80 w-80 rounded-full opacity-15"
          style={{
            background:
              'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 70%)',
            animationDelay: '2s',
          }}
        />
        <div
          className="animate-float-slow absolute bottom-0 left-1/3 h-72 w-72 rounded-full opacity-10"
          style={{
            background:
              'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)',
            animationDelay: '4s',
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <header className="glass-strong sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-3">
            <div className="gradient-primary flex h-9 w-9 items-center justify-center rounded-xl shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-110">
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
            <Link
              to="/"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-muted transition-all duration-200 hover:bg-surface-light/50 hover:text-text"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/video/:videoId" element={<VideoPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-16 border-t border-surface-light/30 py-8 text-center text-sm text-text-dim">
        <p>YouTube Learning Companion &middot; Transform videos into knowledge</p>
      </footer>
    </div>
  );
}

export default App;
