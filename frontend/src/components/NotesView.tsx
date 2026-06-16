import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Loader2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  BookOpen,
} from 'lucide-react';
import { getNotes, generateNotes } from '../api/client';
import type { Note } from '../types';

interface NotesViewProps {
  videoId: string;
  onNotesGenerated?: () => void;
}

export default function NotesView({ videoId, onNotesGenerated }: NotesViewProps) {
  const [notes, setNotes] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getNotes(videoId);
      setNotes(data);
    } catch {
      setNotes(null);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateNotes(videoId);
      setNotes(data);
      onNotesGenerated?.(); // Let parent know so the sidebar checklist updates!
    } catch {
      setError('Failed to generate notes. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!notes) return;
    try {
      await navigator.clipboard.writeText(notes.generated_notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <div className="glass p-8 bg-white border border-surface-light">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#E11D48]" />
          <span className="text-sm font-medium text-text-muted">Loading summary...</span>
        </div>
      </div>
    );
  }

  if (!notes && !generating) {
    return (
      <div className="glass animate-scale-in p-10 text-center bg-white border border-surface-light">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <BookOpen className="h-8 w-8 text-[#E11D48]" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-text">
          Generate Study Notes & Summary
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-text-muted">
          AI will analyze the video transcript and create comprehensive,
          well-structured study notes.
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
          Generate Summary
        </button>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="glass p-12 text-center bg-white border border-surface-light">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <Loader2 className="h-8 w-8 animate-spin text-[#E11D48]" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-text">
          Generating Summary...
        </h3>
        <p className="text-sm text-text-muted">
          This may take a minute. AI is analyzing the video content.
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

  return (
    <div className="glass animate-fade-in bg-white border border-surface-light overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-light px-6 py-4 bg-surface-dark bg-opacity-10">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#E11D48]" />
          <h3 className="text-sm font-bold text-text uppercase tracking-wider">Lesson Summary</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-surface-light bg-white px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-light transition-all duration-150"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#15803D]" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-text-muted" />
                Copy Text
              </>
            )}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-lg border border-surface-light bg-white px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface-light transition-all duration-150"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#E11D48]" />
            Regenerate
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="prose-custom max-w-none text-text">
          <ReactMarkdown>{notes?.generated_notes || ''}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
