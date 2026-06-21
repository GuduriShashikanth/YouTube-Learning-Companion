import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Edit3,
  Eye,
  Clock,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { getVideo, updateUserNotes } from '../api/client';

interface MyNotesViewProps {
  videoId: string;
  currentTime: number;
  onTimestampClick: (seconds: number) => void;
}

export default function MyNotesView({
  videoId,
  currentTime,
  onTimestampClick,
}: MyNotesViewProps) {
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const isFirstRender = useRef<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load existing notes
  useEffect(() => {
    setLoading(true);
    setHasLoaded(false);
    isFirstRender.current = true;
    getVideo(videoId)
      .then((data) => {
        setNotes(data.user_notes || '');
        setHasLoaded(true);
      })
      .catch(() => {
        setHasLoaded(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [videoId]);

  // Autosave notes with 1-second debounce
  useEffect(() => {
    if (!hasLoaded) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        await updateUserNotes(videoId, notes);
        setSaveStatus('saved');
        // Reset status back to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('error');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes, videoId, hasLoaded]);

  // Handle auto-timestamp insertion
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, value } = textarea;

    // Trigger on normal printable character keystrokes (length of 1, no modifier keys)
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      const isStartOfLine = selectionStart === 0 || value.charAt(selectionStart - 1) === '\n';

      if (isStartOfLine) {
        // Format current video time as MM:SS
        const mins = Math.floor(currentTime / 60);
        const secs = Math.floor(currentTime % 60);
        const timeStr = `[${mins}:${secs.toString().padStart(2, '0')}] `;

        // Insert timestamp and the typed character
        const before = value.substring(0, selectionStart);
        const after = value.substring(selectionStart);
        const updatedValue = before + timeStr + e.key + after;

        // Prevent default keystroke action
        e.preventDefault();

        // Set value and adjust cursor selection range
        setNotes(updatedValue);

        const newCursorPos = selectionStart + timeStr.length + 1;
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      }
    }
  };

  // Convert raw timestamps e.g. [12:34] to Markdown seek links [[12:34]](#seek-12:34)
  const preprocessMarkdown = (text: string): string => {
    return text.replace(/\[((\d{1,2}:)?\d{1,2}:\d{2})\]/g, (match, timeStr) => {
      return `[${match}](#seek-${timeStr})`;
    });
  };

  // Seek video on timestamp click
  const handleTimestampLinkClick = (timeStr: string) => {
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    onTimestampClick(seconds);
  };

  // Custom component renderers for ReactMarkdown
  const customRenderers = {
    a: ({ href, children, ...props }: any) => {
      if (href && href.startsWith('#seek-')) {
        const timeStr = href.replace('#seek-', '');
        return (
          <button
            onClick={() => handleTimestampLinkClick(timeStr)}
            className="inline-flex items-center gap-0.5 rounded bg-red-50 border border-red-100 px-1.5 py-0.5 text-[11px] font-bold text-[#E11D48] hover:bg-red-100 transition-all duration-150 mr-1"
          >
            <Clock className="h-2.5 w-2.5" />
            {children}
          </button>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-white">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#E11D48]" />
          <span className="text-sm font-medium text-text-muted">Loading notepad...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white select-none animate-fade-in">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-surface-light px-4 py-3 bg-surface-dark bg-opacity-10">
        <div className="flex items-center gap-2">
          {/* Edit / Preview segmented control */}
          <div className="flex rounded-lg border border-surface-light bg-white p-0.5">
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all duration-150 ${
                mode === 'edit'
                  ? 'bg-[#E11D48] text-white shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Edit3 className="h-3 w-3" />
              Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md transition-all duration-150 ${
                mode === 'preview'
                  ? 'bg-[#E11D48] text-white shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Eye className="h-3 w-3" />
              Preview
            </button>
          </div>
        </div>

        {/* Autosave Status Indicator */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-dim">
          {saveStatus === 'saving' && (
            <>
              <CloudUpload className="h-3.5 w-3.5 animate-pulse text-[#E11D48]" />
              Saving...
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D]" />
              Saved
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-[#DC2626]" />
              Save Failed
            </>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-hidden p-3 min-h-0 flex flex-col">
        {mode === 'edit' ? (
          <div className="flex-1 flex flex-col min-h-0">
            <textarea
              ref={textareaRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your notes here... &#10;&#10;💡 Press Enter to start a new line, and a timestamp [MM:SS] will be automatically inserted as soon as you begin typing!"
              className="flex-1 w-full resize-none rounded-xl border border-surface-light p-4 text-xs font-semibold text-text placeholder-text-muted outline-none transition-all duration-200 focus:border-[#E11D48] focus:shadow-md focus:shadow-red-500/5 min-h-[300px] overflow-y-auto"
            />
            <div className="mt-2 flex items-center gap-1.5 px-1 text-[10px] font-medium text-text-dim">
              <Sparkles className="h-3 w-3 text-[#E11D48]" />
              Notes auto-save as you type. Markdown is supported.
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto border border-surface-light rounded-xl p-4 min-h-[300px] bg-slate-50/30">
            {notes.trim() === '' ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <Edit3 className="h-8 w-8 text-text-dim mb-2 opacity-50" />
                <p className="text-xs font-semibold text-text-dim">Your notepad is empty</p>
                <p className="text-[10px] text-text-dim mt-0.5">Switch to Edit mode to write study notes.</p>
              </div>
            ) : (
              <div className="prose-custom max-w-none text-text">
                <ReactMarkdown components={customRenderers}>
                  {preprocessMarkdown(notes)}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
