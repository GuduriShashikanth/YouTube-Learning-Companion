// ─── Auth ───────────────────────────────────────────────────────────

export interface UserOut {
  id: string;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserOut;
}

// ─── Videos ─────────────────────────────────────────────────────────

export interface Video {
  id: string;
  youtube_url: string;
  youtube_video_id: string;
  title: string | null;
  channel_name: string | null;
  duration: number | null;
  thumbnail_url: string | null;
  user_notes: string | null;
  created_at: string;
}

export interface TranscriptChunk {
  text: string;
  start: number;
  duration: number;
}

export interface Transcript {
  id: string;
  video_id: string;
  transcript_text: string;
  timestamps: TranscriptChunk[] | null;
  created_at: string;
}

export interface Note {
  id: string;
  video_id: string;
  generated_notes: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  video_id: string;
  question: string;
  answer: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
}

export interface Quiz {
  id: string;
  video_id: string;
  questions: QuizQuestion[];
  created_at: string;
}

export interface ChatSource {
  text: string;
  start_time: number | null;
  end_time: number | null;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  video_id: string;
}

export interface ChatHistoryItem {
  id: string;
  user_question: string;
  ai_response: string;
  sources: ChatSource[] | null;
  created_at: string;
}
