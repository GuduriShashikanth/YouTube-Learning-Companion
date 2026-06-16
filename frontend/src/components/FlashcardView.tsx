import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { getFlashcards, generateFlashcards } from '../api/client';
import type { Flashcard } from '../types';

interface FlashcardViewProps {
  videoId: string;
}

export default function FlashcardView({ videoId }: FlashcardViewProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchFlashcards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFlashcards(videoId);
      setFlashcards(data.flashcards);
    } catch {
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchFlashcards();
  }, [fetchFlashcards]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateFlashcards(videoId);
      setFlashcards(data.flashcards);
      setCurrentIndex(0);
    } catch {
      setError('Failed to generate flashcards. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const goNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-text-muted">Loading flashcards...</span>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0 && !generating) {
    return (
      <div className="glass animate-scale-in rounded-2xl py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Layers className="h-8 w-8 text-accent" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text">
          Generate Flashcards
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-text-muted">
          Create study cards from the video content for effective learning.
        </p>
        {error && (
          <div className="animate-fade-in-down mx-auto mb-4 flex max-w-md items-center justify-center gap-2 text-sm text-error-light">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <button
          onClick={handleGenerate}
          className="gradient-primary animate-pulse-glow inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40"
        >
          <Sparkles className="h-4 w-4" />
          Generate Flashcards
        </button>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="glass rounded-2xl py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text">
          Generating Flashcards...
        </h3>
        <p className="text-sm text-text-muted">
          Creating study cards from video content.
        </p>
        <div className="mx-auto mt-6 h-1 w-48 overflow-hidden rounded-full bg-surface-light/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-primary"
            style={{
              animation: 'shimmer 1.5s ease-in-out infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>
    );
  }

  const card = flashcards[currentIndex];

  return (
    <div className="glass animate-fade-in rounded-2xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold text-text">Flashcards</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-surface-light/50 px-3 py-1 text-xs font-medium text-text-muted">
            {currentIndex + 1} / {flashcards.length}
          </span>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-all duration-200 hover:bg-surface-light/40 hover:text-text"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Regenerate
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1 overflow-hidden rounded-full bg-surface-light/30">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
          style={{
            width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
          }}
        />
      </div>

      {/* Flashcard — Question then Answer */}
      <div className="mx-auto mb-6 max-w-xl rounded-2xl border border-surface-light/30 bg-gradient-to-br from-surface via-surface-dark to-surface shadow-xl">
        {/* Question section */}
        <div className="flex flex-col items-center px-8 pt-8 pb-5">
          <div className="mb-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary-light">
            QUESTION
          </div>
          <p className="text-center text-lg font-medium leading-relaxed text-text">
            {card.question}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-8 border-t border-surface-light/40" />

        {/* Answer section */}
        <div className="flex flex-col items-center px-8 pt-5 pb-8">
          <div className="mb-3 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            ANSWER
          </div>
          <p className="text-center text-base leading-relaxed text-text-muted">
            {card.answer}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-light/30 text-text-muted transition-all duration-200 hover:border-primary/30 hover:bg-surface-light/30 hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="text-xs text-text-dim">
          {currentIndex + 1} of {flashcards.length}
        </span>

        <button
          onClick={goNext}
          disabled={currentIndex === flashcards.length - 1}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-light/30 text-text-muted transition-all duration-200 hover:border-primary/30 hover:bg-surface-light/30 hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
