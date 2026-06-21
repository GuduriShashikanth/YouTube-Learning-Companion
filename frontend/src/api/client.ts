import axios from 'axios';
import type {
  Video,
  Transcript,
  Note,
  Flashcard,
  Quiz,
  ChatResponse,
  ChatHistoryItem,
  TokenResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor — inject Bearer token ───────────────────────

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — catch 401, clear token ──────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear token on 401s from protected resource endpoints,
      // NOT from the auth endpoints themselves (signup/signin return 401 for bad creds)
      const url: string = error.config?.url ?? '';
      const isAuthEndpoint = url.includes('/auth/signin') || url.includes('/auth/signup');
      if (!isAuthEndpoint) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        // Notify AuthContext via a custom event (avoids hard page reload)
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth endpoints ─────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string
): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/auth/signup', {
    email,
    password,
  });
  return data;
}

export async function signIn(
  email: string,
  password: string
): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/auth/signin', {
    email,
    password,
  });
  return data;
}

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
    '/videos',
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

export async function generateQuiz(videoId: string, force: boolean = false): Promise<Quiz> {
  const { data } = await api.post<Quiz>(`/videos/${videoId}/quiz`, null, {
    params: force ? { force: true } : undefined,
  });
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

export async function updateUserNotes(
  videoId: string,
  userNotes: string
): Promise<Video> {
  const { data } = await api.patch<Video>(`/videos/${videoId}/user-notes`, {
    user_notes: userNotes,
  });
  return data;
}

export async function downloadFlashcardsCSV(
  videoId: string,
  filename: string
): Promise<void> {
  const response = await api.get(`/videos/${videoId}/flashcards/export/csv`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadFlashcardsAPKG(
  videoId: string,
  filename: string
): Promise<void> {
  const response = await api.get(`/videos/${videoId}/flashcards/export/apkg`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadNotesPDF(
  videoId: string,
  filename: string
): Promise<void> {
  const response = await api.get(`/videos/${videoId}/notes/export/pdf`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default api;
