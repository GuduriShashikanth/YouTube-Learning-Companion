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

export default function ChatPanel({ videoId, onTimestampClick }: ChatPanelProps) {
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
    <div className="glass flex h-[600px] flex-col rounded-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-surface-light/30 px-6 py-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-text">AI Chat</h3>
        <span className="ml-auto rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
          RAG
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingHistory ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <h4 className="mb-1 text-sm font-semibold text-text">
              Ask about the video
            </h4>
            <p className="max-w-xs text-xs text-text-dim">
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
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    msg.role === 'user'
                      ? 'bg-primary/20'
                      : 'bg-surface-light/50'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="h-4 w-4 text-primary-light" />
                  ) : (
                    <Bot className="h-4 w-4 text-text-muted" />
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'rounded-tr-md bg-primary/20 text-text'
                      : 'rounded-tl-md bg-surface-light/30 text-text-muted'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose-custom text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 border-t border-surface-light/20 pt-2">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-dim">
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
                              className="flex items-center gap-1 rounded-md bg-surface-dark/60 px-2 py-1 text-[10px] font-mono text-primary-light transition-colors hover:bg-primary/15"
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-light/50">
                  <Bot className="h-4 w-4 text-text-muted" />
                </div>
                <div className="rounded-2xl rounded-tl-md bg-surface-light/30 px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="typing-dot h-2 w-2 rounded-full bg-text-dim" />
                    <div className="typing-dot h-2 w-2 rounded-full bg-text-dim" />
                    <div className="typing-dot h-2 w-2 rounded-full bg-text-dim" />
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
        <div className="animate-fade-in-down flex items-center gap-2 border-t border-error/20 bg-error/5 px-4 py-2 text-xs text-error-light">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-surface-light/30 p-4">
        <div className="flex items-center gap-2 rounded-xl bg-surface-dark/60 px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the video..."
            disabled={sending}
            className="min-w-0 flex-1 bg-transparent py-1 text-sm text-text placeholder-text-dim outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/80 text-white transition-all duration-200 hover:bg-primary disabled:cursor-not-allowed disabled:opacity-30"
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
