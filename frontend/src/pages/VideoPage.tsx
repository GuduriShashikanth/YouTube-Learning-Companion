import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText,
  BookOpen,
  Layers,
  Brain,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { getVideo } from '../api/client';
import type { Video } from '../types';
import VideoPlayer from '../components/VideoPlayer';
import TranscriptView from '../components/TranscriptView';
import NotesView from '../components/NotesView';
import FlashcardView from '../components/FlashcardView';
import QuizView from '../components/QuizView';
import ChatPanel from '../components/ChatPanel';
import Sidebar from '../components/Sidebar';

type TabKey = 'transcript' | 'notes' | 'flashcards' | 'quiz' | 'chat';

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: 'transcript', label: 'Transcript', icon: FileText },
  { key: 'notes', label: 'Notes', icon: BookOpen },
  { key: 'flashcards', label: 'Flashcards', icon: Layers },
  { key: 'quiz', label: 'Quiz', icon: Brain },
  { key: 'chat', label: 'Chat', icon: MessageSquare },
];

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('transcript');
  const [startTime, setStartTime] = useState<number | undefined>(undefined);

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
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="skeleton mb-6 aspect-video w-full rounded-2xl" />
            <div className="skeleton mb-4 h-8 w-64 rounded-xl" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-10 w-24 rounded-xl" />
              ))}
            </div>
            <div className="skeleton mt-6 h-64 w-full rounded-2xl" />
          </div>
          <div className="hidden lg:block">
            <div className="skeleton h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="glass animate-scale-in rounded-2xl p-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error/10">
            <AlertCircle className="h-8 w-8 text-error" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-text">
            {error || 'Video not found'}
          </h2>
          <p className="mb-6 text-sm text-text-muted">
            Something went wrong loading this video.
          </p>
          <button
            onClick={fetchVideo}
            className="gradient-primary inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="min-w-0">
          {/* Video Player */}
          <div className="animate-fade-in mb-6">
            <VideoPlayer
              youtubeVideoId={video.youtube_video_id}
              startTime={startTime}
            />
          </div>

          {/* Video Title */}
          <h1 className="animate-fade-in mb-4 text-xl font-bold text-text sm:text-2xl">
            {video.title || 'Untitled Video'}
          </h1>

          {/* Tab Navigation */}
          <div className="animate-fade-in mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-surface/80 p-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'gradient-primary text-white shadow-lg shadow-primary/20'
                      : 'text-text-muted hover:bg-surface-light/50 hover:text-text'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === 'transcript' && (
              <TranscriptView
                videoId={video.id}
                onTimestampClick={handleTimestampClick}
              />
            )}
            {activeTab === 'notes' && <NotesView videoId={video.id} />}
            {activeTab === 'flashcards' && (
              <FlashcardView videoId={video.id} />
            )}
            {activeTab === 'quiz' && <QuizView videoId={video.id} />}
            {activeTab === 'chat' && (
              <ChatPanel
                videoId={video.id}
                onTimestampClick={handleTimestampClick}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <Sidebar currentVideoId={video.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}
