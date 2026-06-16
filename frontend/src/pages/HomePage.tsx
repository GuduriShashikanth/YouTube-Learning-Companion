import { useState, useEffect } from 'react';
import {
  BookOpen,
  Brain,
  MessageSquare,
  Layers,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import VideoInput from '../components/VideoInput';
import { getVideos } from '../api/client';
import type { Video } from '../types';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Smart Notes',
    description: 'AI-generated study notes with key concepts and summaries',
    bg: 'bg-red-50',
    iconColor: 'text-[#E11D48]',
  },
  {
    icon: Layers,
    title: 'Flashcards',
    description: 'Interactive flashcards for spaced repetition learning',
    bg: 'bg-red-50',
    iconColor: 'text-[#E11D48]',
  },
  {
    icon: Brain,
    title: 'Quiz Mode',
    description: 'Test your understanding with auto-generated quizzes',
    bg: 'bg-red-50',
    iconColor: 'text-[#E11D48]',
  },
  {
    icon: MessageSquare,
    title: 'AI Chat',
    description: 'Ask questions about the video with RAG-powered answers',
    bg: 'bg-red-50',
    iconColor: 'text-[#E11D48]',
  },
  {
    icon: Clock,
    title: 'Timestamps',
    description: 'Navigate with clickable timestamps linked to the video',
    bg: 'bg-red-50',
    iconColor: 'text-[#E11D48]',
  },
];

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  useEffect(() => {
    getVideos(0, 12)
      .then((res) => setVideos(res.videos))
      .catch(() => {})
      .finally(() => setLoadingVideos(false));
  }, []);

  return (
    <div className="mx-auto max-w-none px-4 py-8 md:px-8 lg:px-12">
      {/* Hero Section */}
      <section className="animate-fade-in-up py-12 text-center sm:py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/50 px-4 py-1.5 text-sm font-semibold text-[#E11D48]">
          <Sparkles className="h-4 w-4" />
          AI-Powered Video Learning
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          <span className="text-text">YouTube</span>{' '}
          <span className="text-[#E11D48]">Learning Companion</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-muted sm:text-xl font-medium">
          Transform any YouTube video into interactive study materials.
          <br className="hidden sm:block" />
          Notes, flashcards, quizzes, and AI chat — all in one place.
        </p>

        {/* Video Input */}
        <div className="mx-auto mt-10 max-w-2xl">
          <VideoInput />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="mb-2 text-center text-sm font-bold uppercase tracking-widest text-[#E11D48]">
          Features
        </h2>
        <p className="mb-10 text-center text-2xl font-bold text-text sm:text-3xl">
          Everything you need to learn effectively
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="glass group cursor-default rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div
                  className={`mb-4 inline-flex rounded-xl ${feature.bg} p-2.5 border border-red-100`}
                >
                  <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className="mb-1.5 text-sm font-bold text-text">
                  {feature.title}
                </h3>
                <p className="text-xs font-semibold leading-relaxed text-text-muted">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Videos Section */}
      <section className="py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text">Recent Videos</h2>
            <p className="mt-1 text-sm text-text-muted">
              Pick up where you left off
            </p>
          </div>
        </div>

        {loadingVideos ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5">
                <div className="skeleton mb-3 h-36 w-full rounded-xl" />
                <div className="skeleton mb-2 h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="glass rounded-2xl py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-light/50">
              <BookOpen className="h-7 w-7 text-text-dim" />
            </div>
            <p className="text-lg font-medium text-text-muted">
              No videos yet
            </p>
            <p className="mt-1 text-sm text-text-dim">
              Paste a YouTube URL above to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video, i) => (
              <Link
                key={video.id}
                to={`/video/${video.id}`}
                className="glass group animate-fade-in rounded-2xl p-1 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Thumbnail */}
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                    alt={video.title || 'Video thumbnail'}
                    className="aspect-video w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-dark/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <ArrowRight className="h-3 w-3" />
                    Open
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="mb-1 line-clamp-2 text-sm font-semibold text-text transition-colors group-hover:text-primary-light">
                    {video.title || 'Untitled Video'}
                  </h3>
                  <p className="text-xs text-text-dim">
                    {new Date(video.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
