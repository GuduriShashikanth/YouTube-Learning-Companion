import axios from 'axios';
import type {
  Video,
  Transcript,
  Note,
  Flashcard,
  Quiz,
  ChatResponse,
  ChatHistoryItem,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Video endpoints ────────────────────────────────────────────────

export async function processVideo(youtubeUrl: string): Promise<Video> {
  const { data } = await api.post<Video>('/videos/process', {
    youtube_url: youtubeUrl,
  });
  return data;
}

export async function getVideo(videoId: string): Promise<Video> {
  const { data } = await api.get<Video>(`/videos/${videoId}`);
  return data;
}

export async function getVideos(
  skip: number = 0,
  limit: number = 20
): Promise<{ videos: Video[]; total: number }> {
  const { data } = await api.get<{ videos: Video[]; total: number }>(
    '/videos/',
    { params: { skip, limit } }
  );
  return data;
}

// ─── Notes endpoints ────────────────────────────────────────────────

export async function getTranscript(videoId: string): Promise<Transcript> {
  const { data } = await api.get<Transcript>(`/videos/${videoId}/transcript`);
  return data;
}

export async function generateNotes(videoId: string): Promise<Note> {
  const { data } = await api.post<Note>(`/videos/${videoId}/notes`);
  return data;
}

export async function getNotes(videoId: string): Promise<Note> {
  const { data } = await api.get<Note>(`/videos/${videoId}/notes`);
  return data;
}

// ─── Flashcard endpoints ────────────────────────────────────────────

export async function generateFlashcards(
  videoId: string
): Promise<{ flashcards: Flashcard[]; total: number }> {
  const { data } = await api.post<{ flashcards: Flashcard[]; total: number }>(
    `/videos/${videoId}/flashcards`
  );
  return data;
}

export async function getFlashcards(
  videoId: string
): Promise<{ flashcards: Flashcard[]; total: number }> {
  const { data } = await api.get<{ flashcards: Flashcard[]; total: number }>(
    `/videos/${videoId}/flashcards`
  );
  return data;
}

// ─── Quiz endpoints ─────────────────────────────────────────────────

export async function generateQuiz(videoId: string): Promise<Quiz> {
  const { data } = await api.post<Quiz>(`/videos/${videoId}/quiz`);
  return data;
}

export async function getQuiz(videoId: string): Promise<Quiz> {
  const { data } = await api.get<Quiz>(`/videos/${videoId}/quiz`);
  return data;
}

// ─── Chat endpoints ─────────────────────────────────────────────────

export async function sendChatMessage(
  videoId: string,
  question: string
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>(`/videos/${videoId}/chat`, {
    question,
  });
  return data;
}

export async function getChatHistory(
  videoId: string
): Promise<ChatHistoryItem[]> {
  const { data } = await api.get<ChatHistoryItem[]>(
    `/videos/${videoId}/chat/history`
  );
  return data;
}

export default api;
