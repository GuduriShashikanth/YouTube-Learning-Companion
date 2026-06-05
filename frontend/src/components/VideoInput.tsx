import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Youtube, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { processVideo } from '../api/client';

function isValidYoutubeUrl(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
    /^(https?:\/\/)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
  ];
  return patterns.some((p) => p.test(url.trim()));
}

export default function VideoInput() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();

    if (!trimmed) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!isValidYoutubeUrl(trimmed)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const video = await processVideo(trimmed);
      navigate(`/video/${video.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to process video';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass animate-scale-in rounded-2xl p-1.5">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 rounded-xl bg-surface-dark/60 px-4 py-2">
          <Youtube className="h-5 w-5 shrink-0 text-error" />
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste a YouTube URL..."
            disabled={loading}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-text placeholder-text-dim outline-none sm:text-base"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="gradient-primary flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Processing...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="animate-fade-in-down mt-2 flex items-center gap-2 px-4 py-2 text-sm text-error-light">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading bar */}
      {loading && (
        <div className="mt-1 overflow-hidden rounded-full">
          <div
            className="h-0.5 rounded-full bg-gradient-to-r from-primary via-accent to-primary"
            style={{
              animation: 'shimmer 1.5s ease-in-out infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      )}
    </div>
  );
}
