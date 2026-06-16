import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, RefreshCw, Loader2, Sparkles, MessageSquare, Layers, BookOpen, Brain } from 'lucide-react';
import { getVideo } from '../api/client';
import type { Video } from '../types';
import VideoPlayer from '../components/VideoPlayer';
import TranscriptNotesPanel from '../components/TranscriptNotesPanel';
import NotesView from '../components/NotesView';
import QuizView from '../components/QuizView';
import FlashcardView from '../components/FlashcardView';
import ChatPanel from '../components/ChatPanel';

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | undefined>(undefined);
  const [currentTime, setCurrentTime] = useState(0);
  const [notesUpdatedKey, setNotesUpdatedKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'summary' | 'quiz' | 'flashcards' | 'chat'>('summary');

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
    // Clear start time shortly after so subsequent clicks to same time still trigger state change
    setTimeout(() => setStartTime(undefined), 100);
  }, []);

  const handleNotesGenerated = () => {
    setNotesUpdatedKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-none px-4 py-8 md:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="skeleton mb-6 aspect-video w-full rounded-2xl" />
            <div className="skeleton mb-4 h-8 w-64 rounded-xl" />
            <div className="skeleton mb-6 h-48 w-full rounded-2xl" />
            <div className="skeleton h-64 w-full rounded-2xl" />
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
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
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

          {/* Video Title */}
          <div className="animate-fade-in">
            <h1 className="text-xl md:text-2xl font-bold text-text tracking-tight">
              {video.title || 'Untitled Video'}
            </h1>
            <p className="text-xs font-semibold text-text-muted mt-1">
              Processed on{' '}
              {new Date(video.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Sub-Tabs Navigation */}
          <div className="animate-fade-in flex gap-1 border-b border-surface-light pb-2">
            {[
              { key: 'summary', label: 'Lesson Summary', icon: BookOpen },
              { key: 'quiz', label: 'Lesson Quiz', icon: Brain },
              { key: 'flashcards', label: 'Flashcards', icon: Layers },
              { key: 'chat', label: 'AI Chat Assistant', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl border transition-all duration-200 ${
                    isActive
                      ? 'bg-white border-surface-light text-[#E11D48] shadow-sm'
                      : 'border-transparent text-text-muted hover:text-text hover:bg-surface-light/50 font-medium'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#E11D48]' : 'text-text-muted'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Active Tab Content */}
          <div className="animate-fade-in min-h-[400px]">
            {activeTab === 'summary' && (
              <NotesView videoId={video.id} onNotesGenerated={handleNotesGenerated} />
            )}
            {activeTab === 'quiz' && (
              <QuizView videoId={video.id} />
            )}
            {activeTab === 'flashcards' && (
              <FlashcardView videoId={video.id} />
            )}
            {activeTab === 'chat' && (
              <ChatPanel videoId={video.id} onTimestampClick={handleTimestampClick} />
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <aside className="sticky top-24 w-full">
          <div className="animate-fade-in">
            <TranscriptNotesPanel
              key={notesUpdatedKey}
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
