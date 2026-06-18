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
  isSidebar?: boolean;
}

export default function FlashcardView({ videoId, isSidebar }: FlashcardViewProps) {
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
      <div className={isSidebar ? "p-4 bg-white" : "glass p-8 bg-white border border-surface-light"}>
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#E11D48]" />
          <span className="text-sm font-medium text-text-muted">Loading flashcards...</span>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0 && !generating) {
    return (
      <div className={isSidebar ? "animate-scale-in p-4 text-center bg-white" : "glass animate-scale-in p-10 text-center bg-white border border-surface-light"}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <Layers className="h-8 w-8 text-[#E11D48]" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-text">
          Generate Flashcards
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-text-muted">
          Create study cards from the video content for effective learning.
        </p>
        {error && (
          <div className="animate-fade-in-down mx-auto mb-4 flex max-w-md items-center justify-center gap-2 text-sm text-red-600 font-medium">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <button
          onClick={handleGenerate}
          className="inline-flex items-center gap-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white px-6 py-3 text-sm font-semibold shadow-md transition-all duration-200"
        >
          <Sparkles className="h-4 w-4" />
          Generate Flashcards
        </button>
      </div>
    );
  }

  if (generating) {
    return (
      <div className={isSidebar ? "p-4 text-center bg-white" : "glass p-12 text-center bg-white border border-surface-light"}>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <Loader2 className="h-8 w-8 animate-spin text-[#E11D48]" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-text">
          Generating Flashcards...
        </h3>
        <p className="text-sm text-text-muted">
          Creating study cards from video content.
        </p>
        <div className="mx-auto mt-6 h-1 w-48 overflow-hidden rounded-full bg-surface-light">
          <div
            className="h-full rounded-full bg-[#E11D48]"
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
    <div className={isSidebar ? "flex flex-col h-full bg-white select-none animate-fade-in p-4 overflow-y-auto max-h-[500px]" : "glass animate-fade-in p-6 bg-white border border-surface-light"}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[#E11D48]" />
          <h3 className="text-sm font-bold text-text uppercase tracking-wider">Flashcards</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-surface-light border border-surface-lighter px-3 py-1 text-xs font-semibold text-text-muted">
            {currentIndex + 1} / {flashcards.length}
          </span>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-lg border border-surface-light px-2.5 py-1 text-xs font-semibold text-text-muted transition-all duration-150 hover:bg-surface-light hover:text-text"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#E11D48]" />
            Regen
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-surface-light">
        <div
          className="h-full rounded-full bg-[#E11D48] transition-all duration-300 ease-out"
          style={{
            width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
          }}
        />
      </div>

      {/* Flashcard — Question then Answer */}
      <div className="mx-auto mb-6 w-full max-w-xl rounded-2xl border border-surface-light bg-[#FDFBF7] shadow-sm">
        {/* Question section */}
        <div className="flex flex-col items-center px-6 pt-6 pb-4">
          <div className="mb-3 rounded-full bg-red-50 border border-red-100 px-3 py-0.5 text-[10px] font-bold text-[#E11D48] tracking-wider">
            QUESTION
          </div>
          <p className="text-center text-sm font-bold leading-relaxed text-text">
            {card.question}
          </p>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-surface-light" />

        {/* Answer section */}
        <div className="flex flex-col items-center px-6 pt-4 pb-6">
          <div className="mb-2.5 rounded-full bg-green-50 border border-green-100 px-3 py-0.5 text-[10px] font-bold text-[#15803D] tracking-wider">
            ANSWER
          </div>
          <p className="text-center text-xs font-medium leading-relaxed text-text">
            {card.answer}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-light bg-white text-text-muted transition-all duration-150 hover:border-[#E11D48] hover:text-[#E11D48] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-text-muted disabled:hover:border-surface-light"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="text-xs font-semibold text-text-muted font-mono">
          {currentIndex + 1} of {flashcards.length}
        </span>

        <button
          onClick={goNext}
          disabled={currentIndex === flashcards.length - 1}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-light bg-white text-text-muted transition-all duration-150 hover:border-[#E11D48] hover:text-[#E11D48] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-text-muted disabled:hover:border-surface-light"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
