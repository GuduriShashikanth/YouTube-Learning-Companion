import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Clock, Loader2, AlertCircle, FileText } from 'lucide-react';
import { getTranscript } from '../api/client';
import type { TranscriptChunk } from '../types';

interface TranscriptViewProps {
  videoId: string;
  onTimestampClick?: (seconds: number) => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TranscriptView({
  videoId,
  onTimestampClick,
}: TranscriptViewProps) {
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [fullText, setFullText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTranscript(videoId)
      .then((data) => {
        setFullText(data.transcript_text || '');
        setChunks(data.timestamps || []);
      })
      .catch(() => setError('Failed to load transcript'))
      .finally(() => setLoading(false));
  }, [videoId]);

  const filteredChunks = useMemo(() => {
    if (!search.trim()) return chunks;
    const lower = search.toLowerCase();
    return chunks.filter((c) => c.text.toLowerCase().includes(lower));
  }, [chunks, search]);

  const handleTimestampClick = (index: number, seconds: number) => {
    setActiveIndex(index);
    onTimestampClick?.(seconds);
  };

  if (loading) {
    return (
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-text-muted">Loading transcript...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-error" />
        <p className="text-sm text-text-muted">{error}</p>
      </div>
    );
  }

  if (chunks.length === 0 && !fullText) {
    return (
      <div className="glass rounded-2xl py-16 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-text-dim" />
        <p className="text-lg font-medium text-text-muted">
          No transcript available
        </p>
        <p className="mt-1 text-sm text-text-dim">
          The transcript will appear here once the video is processed.
        </p>
      </div>
    );
  }

  // If we only have full text but no chunks
  if (chunks.length === 0 && fullText) {
    return (
      <div className="glass rounded-2xl p-6">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
          {fullText}
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl">
      {/* Search bar */}
      <div className="border-b border-surface-light/30 p-4">
        <div className="flex items-center gap-2 rounded-xl bg-surface-dark/60 px-3 py-2">
          <Search className="h-4 w-4 text-text-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transcript..."
            className="flex-1 bg-transparent text-sm text-text placeholder-text-dim outline-none"
          />
          {search && (
            <span className="rounded-full bg-surface-light/50 px-2 py-0.5 text-xs text-text-muted">
              {filteredChunks.length} results
            </span>
          )}
        </div>
      </div>

      {/* Transcript list */}
      <div
        ref={containerRef}
        className="max-h-[500px] overflow-y-auto scroll-smooth p-4"
      >
        {filteredChunks.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-dim">
            No matching segments found
          </p>
        ) : (
          <div className="space-y-1">
            {filteredChunks.map((chunk, i) => {
              const originalIndex = chunks.indexOf(chunk);
              const isActive = activeIndex === originalIndex;
              return (
                <div
                  key={`${chunk.start}-${i}`}
                  className={`group flex gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-surface-light/30'
                  }`}
                >
                  <button
                    onClick={() =>
                      handleTimestampClick(originalIndex, chunk.start)
                    }
                    className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-mono font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary/20 text-primary-light'
                        : 'bg-surface-light/40 text-text-dim hover:bg-primary/15 hover:text-primary-light'
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {formatTime(chunk.start)}
                  </button>
                  <p
                    className={`text-sm leading-relaxed ${
                      isActive ? 'text-text' : 'text-text-muted'
                    }`}
                  >
                    {chunk.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
