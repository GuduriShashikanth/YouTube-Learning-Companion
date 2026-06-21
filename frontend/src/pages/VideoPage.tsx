import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, RefreshCw, Loader2, Clock, User } from 'lucide-react';
import { getVideo } from '../api/client';
import type { Video } from '../types';
import VideoPlayer from '../components/VideoPlayer';
import TranscriptNotesPanel from '../components/TranscriptNotesPanel';

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState(0);

  const fetchVideo = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getVideo(videoId);
      setVideo(data);
    } catch {
      setError('Failed to load video. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const handleTimestampClick = useCallback((seconds: number) => {
    setStartTime(seconds);
    setTimeout(() => setStartTime(undefined), 100);
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-none px-4 py-8 md:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="skeleton mb-6 aspect-video w-full rounded-2xl" />
            <div className="skeleton mb-4 h-8 w-64 rounded-xl" />
          </div>
          <div className="hidden lg:block">
            <div className="skeleton h-[600px] w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="glass animate-scale-in rounded-2xl p-10 bg-white border border-surface-light">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-[#E11D48]" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-text">
            {error || 'Video not found'}
          </h2>
          <p className="mb-6 text-sm text-text-muted">
            Something went wrong loading this video.
          </p>
          <button
            onClick={fetchVideo}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white px-6 py-2.5 text-sm font-semibold shadow-md transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-none px-4 py-6 md:px-8 lg:px-12">
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr] items-start">
        {/* Main Content Area */}
        <div className="min-w-0 space-y-6">
          {/* Custom Video Player */}
          <div className="animate-fade-in">
            <VideoPlayer
              youtubeVideoId={video.youtube_video_id}
              startTime={startTime}
              onTimeUpdate={setCurrentTime}
            />
          </div>

          {/* Video Title + Metadata */}
          <div className="animate-fade-in">
            <h1 className="text-xl md:text-2xl font-bold text-text tracking-tight">
              {video.title || 'Untitled Video'}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted">
              {video.channel_name && (
                <span className="flex items-center gap-1 font-semibold">
                  <User className="h-3.5 w-3.5" />
                  {video.channel_name}
                </span>
              )}
              {video.duration && (
                <span className="flex items-center gap-1 rounded-full bg-surface-light border border-surface-lighter px-2 py-0.5 font-bold text-text-dim">
                  <Clock className="h-3 w-3" />
                  {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                </span>
              )}
              <span className="text-text-dim">
                Added{' '}
                {new Date(video.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <aside className="sticky top-24 w-full">
          <div className="animate-fade-in">
            <TranscriptNotesPanel
              videoId={video.id}
              currentTime={currentTime}
              onTimestampClick={handleTimestampClick}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
