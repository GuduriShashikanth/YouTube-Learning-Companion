import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Loader2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  BookOpen,
  FileDown,
} from 'lucide-react';
import { getNotes, generateNotes, downloadNotesPDF } from '../api/client';
import type { Note } from '../types';

interface NotesViewProps {
  videoId: string;
  onNotesGenerated?: () => void;
  isSidebar?: boolean;
}

export default function NotesView({ videoId, onNotesGenerated, isSidebar }: NotesViewProps) {
  const [notes, setNotes] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

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

  const handleDownloadPDF = async () => {
    if (!notes) return;
    setDownloadingPDF(true);
    try {
      await downloadNotesPDF(videoId, `study-guide-${videoId}.pdf`);
    } catch {
      // error fallback
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!notes) return;
    const file = new Blob([notes.generated_notes], { type: 'text/markdown' });
    const objectUrl = URL.createObjectURL(file);
    const element = document.createElement('a');
    element.href = objectUrl;
    element.download = `study-notes-${videoId}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(objectUrl);
  };

  if (loading) {
    return (
      <div className={isSidebar ? "p-4 bg-white" : "glass p-8 bg-white border border-surface-light"}>
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#E11D48]" />
          <span className="text-sm font-medium text-text-muted">Loading summary...</span>
        </div>
      </div>
    );
  }

  if (!notes && !generating) {
    return (
      <div className={isSidebar ? "animate-scale-in p-4 text-center bg-white" : "glass animate-scale-in p-10 text-center bg-white border border-surface-light"}>
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
      <div className={isSidebar ? "p-4 text-center bg-white" : "glass p-12 text-center bg-white border border-surface-light"}>
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
    <div className={isSidebar ? "flex flex-col h-full bg-white select-none animate-fade-in" : "glass animate-fade-in bg-white border border-surface-light overflow-hidden"}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-light px-4 py-3 bg-surface-dark bg-opacity-10">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[#E11D48]" />
          <h3 className="text-xs font-bold text-text uppercase tracking-wider">Lesson Summary</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-surface-light bg-white px-2 py-1 text-[11px] font-semibold text-text hover:bg-surface-light transition-all duration-150"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[#15803D]" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-text-muted" />
                Copy
              </>
            )}
          </button>
          
          <button
            onClick={handleDownloadMarkdown}
            title="Download as Markdown"
            className="flex items-center gap-1.5 rounded-lg border border-surface-light bg-white px-2 py-1 text-[11px] font-semibold text-text hover:bg-surface-light transition-all duration-150"
          >
            <FileDown className="h-3 w-3 text-text-muted" />
            Markdown
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            title="Download styled PDF Guide"
            className="flex items-center gap-1.5 rounded-lg border border-surface-light bg-white px-2 py-1 text-[11px] font-semibold text-text hover:bg-surface-light transition-all duration-150 disabled:opacity-50"
          >
            {downloadingPDF ? (
              <Loader2 className="h-3 w-3 animate-spin text-text-muted" />
            ) : (
              <FileDown className="h-3 w-3 text-red-600" />
            )}
            PDF
          </button>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-lg border border-surface-light bg-white px-2 py-1 text-[11px] font-semibold text-text hover:bg-surface-light transition-all duration-150"
          >
            <Sparkles className="h-3 w-3 text-[#E11D48]" />
            Regen
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto flex-1 min-h-0">
        <div className="prose-custom max-w-none text-text">
          <ReactMarkdown>{notes?.generated_notes || ''}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
