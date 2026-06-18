import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Loader2,
  MessageSquare,
  User,
  Bot,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { sendChatMessage, getChatHistory } from '../api/client';
import type { ChatSource, ChatHistoryItem } from '../types';

interface ChatPanelProps {
  videoId: string;
  onTimestampClick?: (seconds: number) => void;
  isSidebar?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
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

export default function ChatPanel({ videoId, onTimestampClick, isSidebar }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load chat history
  useEffect(() => {
    setLoadingHistory(true);
    getChatHistory(videoId)
      .then((history: ChatHistoryItem[]) => {
        const loaded: ChatMessage[] = [];
        history.forEach((item) => {
          loaded.push({ role: 'user', content: item.user_question });
          loaded.push({
            role: 'assistant',
            content: item.ai_response,
            sources: item.sources || undefined,
          });
        });
        setMessages(loaded);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [videoId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setSending(true);

    try {
      const response = await sendChatMessage(videoId, trimmed);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.answer,
          sources: response.sources,
        },
      ]);
    } catch {
      setError('Failed to get response. Please try again.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={isSidebar ? "flex flex-col h-[520px] bg-white select-none animate-fade-in overflow-hidden" : "glass flex h-[600px] flex-col rounded-2xl bg-white border border-surface-light overflow-hidden"}>
      {/* Header */}
      <div className={isSidebar ? "flex items-center gap-2 border-b border-surface-light px-4 py-3 bg-surface-dark bg-opacity-10" : "flex items-center gap-2 border-b border-surface-light px-6 py-4 bg-surface-dark bg-opacity-10"}>
        <MessageSquare className="h-5 w-5 text-[#E11D48]" />
        <h3 className={isSidebar ? "text-xs font-bold text-text uppercase tracking-wider" : "text-sm font-bold text-text uppercase tracking-wider"}>AI Chat</h3>
        <span className="ml-auto rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[9px] font-bold text-[#15803D]">
          AI RAG
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingHistory ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#E11D48]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-4">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border border-red-100">
              <Bot className="h-7 w-7 text-[#E11D48]" />
            </div>
            <h4 className="mb-1 text-sm font-bold text-text">
              Ask about the video
            </h4>
            <p className="max-w-xs text-xs font-semibold text-text-muted">
              I can answer questions about the video content using AI-powered
              retrieval. Try asking about key concepts, details, or summaries.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`animate-fade-in flex gap-3 ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    msg.role === 'user'
                      ? 'bg-red-50 border-red-100 text-[#E11D48]'
                      : 'bg-surface-light border-surface-lighter text-text-muted'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 border ${
                    msg.role === 'user'
                      ? 'rounded-tr-md bg-red-50 border-red-100 text-text'
                      : 'rounded-tl-md bg-surface-light border-surface-lighter text-text'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose-custom text-xs font-semibold">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs font-bold leading-relaxed">{msg.content}</p>
                  )}

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 border-t border-surface-light pt-2">
                      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-text-muted">
                        Sources
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, si) =>
                          src.start_time !== null ? (
                            <button
                              key={si}
                              onClick={() =>
                                onTimestampClick?.(src.start_time!)
                              }
                              className="flex items-center gap-1 rounded-md bg-white border border-surface-light px-2 py-1 text-[10px] font-mono font-bold text-text-muted transition-colors hover:border-[#E11D48] hover:text-[#E11D48] hover:bg-red-50"
                              title={src.text}
                            >
                              <Clock className="h-2.5 w-2.5" />
                              {formatTime(src.start_time!)}
                            </button>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="animate-fade-in flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-light border border-surface-lighter text-text-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-md bg-surface-light border border-surface-lighter px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="typing-dot h-1.5 w-1.5 rounded-full bg-text-muted" />
                    <div className="typing-dot h-1.5 w-1.5 rounded-full bg-text-muted" />
                    <div className="typing-dot h-1.5 w-1.5 rounded-full bg-text-muted" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="animate-fade-in-down flex items-center gap-2 border-t border-red-200 bg-red-50/50 px-4 py-2 text-xs font-bold text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-surface-light p-3 bg-white">
        <div className="flex items-center gap-2 rounded-xl border border-surface-light bg-surface-dark bg-opacity-10 px-3 py-1.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI about this video..."
            disabled={sending}
            className="min-w-0 flex-1 bg-transparent py-1 text-xs text-text placeholder-text-muted outline-none font-semibold"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E11D48] text-white transition-all duration-200 hover:bg-[#BE123C] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
