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
}

export default function NotesView({ videoId }: NotesViewProps) {
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
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-text-muted">Loading notes...</span>
        </div>
      </div>
    );
  }

  if (!notes && !generating) {
    return (
      <div className="glass animate-scale-in rounded-2xl py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text">
          Generate Study Notes
        </h3>
        <p className="mx-auto mb-6 max-w-md text-sm text-text-muted">
          AI will analyze the video transcript and create comprehensive,
          well-structured study notes.
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
          Generate Notes
        </button>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="glass rounded-2xl py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-text">
          Generating Notes...
        </h3>
        <p className="text-sm text-text-muted">
          This may take a minute. AI is analyzing the video content.
        </p>
        <div className="mx-auto mt-6 h-1 w-48 overflow-hidden rounded-full bg-surface-light/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
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
    <div className="glass animate-fade-in rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-light/30 px-6 py-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold text-text">Study Notes</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-all duration-200 hover:bg-surface-light/40 hover:text-text"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
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

      {/* Content */}
      <div className="max-h-[600px] overflow-y-auto p-6">
        <div className="prose-custom">
          <ReactMarkdown>{notes?.generated_notes || ''}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
