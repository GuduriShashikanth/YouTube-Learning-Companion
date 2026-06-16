import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Clock, Loader2 } from 'lucide-react';
import { getTranscript } from '../api/client';
import type { TranscriptChunk } from '../types';

interface TranscriptNotesPanelProps {
  videoId: string;
  currentTime: number;
  onTimestampClick: (seconds: number) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TranscriptNotesPanel({
  videoId,
  currentTime,
  onTimestampClick,
}: TranscriptNotesPanelProps) {
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [loadingTranscript, setLoadingTranscript] = useState(true);
  const [transcriptSearch, setTranscriptSearch] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);

  // Fetch transcript
  useEffect(() => {
    setLoadingTranscript(true);
    getTranscript(videoId)
      .then((data) => {
        setChunks(data.timestamps || []);
      })
      .catch(() => {})
      .finally(() => setLoadingTranscript(false));
  }, [videoId]);

  // Filtered transcript chunks
  const filteredChunks = useMemo(() => {
    if (!transcriptSearch.trim()) return chunks;
    const lower = transcriptSearch.toLowerCase();
    return chunks.filter((c) => c.text.toLowerCase().includes(lower));
  }, [chunks, transcriptSearch]);

  // Find index of currently active chunk based on currentTime
  const activeIndex = useMemo(() => {
    if (chunks.length === 0) return -1;
    let bestIndex = -1;
    for (let i = 0; i < chunks.length; i++) {
      if (currentTime >= chunks[i].start) {
        bestIndex = i;
      } else {
        break;
      }
    }
    return bestIndex;
  }, [chunks, currentTime]);

  // Auto scroll transcript container when activeIndex changes
  useEffect(() => {
    if (activeRowRef.current && containerRef.current) {
      const activeEl = activeRowRef.current;
      const containerEl = containerRef.current;
      
      const activeTop = activeEl.offsetTop;
      const activeHeight = activeEl.offsetHeight;
      const containerHeight = containerEl.clientHeight;
      
      containerEl.scrollTo({
        top: activeTop - containerHeight / 2 + activeHeight / 2,
        behavior: 'smooth'
      });
    }
  }, [activeIndex]);

  return (
    <div className="glass flex flex-col h-[600px] bg-white border border-surface-light overflow-hidden select-none">
      {/* Header */}
      <div className="flex border-b border-surface-light p-3 bg-surface-dark bg-opacity-30">
        <h4 className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-[#E11D48]" />
          Video Transcript
        </h4>
      </div>

      {/* Search bar */}
      <div className="p-3 border-b border-surface-light bg-white">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surface-light bg-surface-dark bg-opacity-10">
          <Search className="h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="Search transcript..."
            value={transcriptSearch}
            onChange={(e) => setTranscriptSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-text placeholder-text-muted outline-none"
          />
        </div>
      </div>

      {/* Transcript scrollable content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-3 space-y-1.5"
      >
        {loadingTranscript ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-muted text-xs">
            <Loader2 className="h-5 w-5 animate-spin text-[#E11D48]" />
            Loading transcript...
          </div>
        ) : filteredChunks.length === 0 ? (
          <div className="text-center py-12 text-xs text-text-muted">
            No matching transcript lines.
          </div>
        ) : (
          filteredChunks.map((chunk) => {
            const originalIndex = chunks.indexOf(chunk);
            const isActive = activeIndex === originalIndex;
            return (
              <div
                key={`${chunk.start}-${originalIndex}`}
                ref={isActive ? activeRowRef : null}
                onClick={() => onTimestampClick(chunk.start)}
                className={`flex gap-3 rounded-lg p-2.5 cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-[#FEF3C7] border border-[#FEF3C7] shadow-sm'
                    : 'hover:bg-surface-light border border-transparent'
                }`}
              >
                <span className="text-[11px] font-mono font-bold text-text-muted mt-0.5 shrink-0">
                  {formatTime(chunk.start)}
                </span>
                <p className="text-[13px] leading-relaxed text-text">
                  {chunk.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
