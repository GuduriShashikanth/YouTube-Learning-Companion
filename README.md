# 🎓 YouTube Learning Companion

A production-ready full-stack application that transforms YouTube videos into interactive study materials. Paste a YouTube URL and get structured notes, flashcards, quizzes, and AI-powered Q&A — all with timestamp references.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Structured Notes** | AI-generated study notes with headings, bullet points, and key takeaways |
| 🃏 **Flashcards** | 20 interactive Q&A flashcards per video |
| 📋 **Quizzes** | 10 MCQs with explanations and scoring |
| 💬 **RAG Chat** | Ask questions about the video with context-aware answers |
| ⏱️ **Timestamps** | Click-to-seek timestamp references throughout |
| 📄 **Transcripts** | Full transcript with searchable, clickable segments |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + TS)                  │
│              Tailwind CSS • Vite • Axios                 │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP (REST API)
┌─────────────────────▼───────────────────────────────────┐
│                  Backend (FastAPI)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Routers  │→ │ Services │→ │  Repos   │→ PostgreSQL   │
│  └──────────┘  └────┬─────┘  └──────────┘               │
│                     │                                     │
│               ┌─────▼─────┐                              │
│               │    RAG    │→ ChromaDB                     │
│               │ Pipeline  │→ Sentence Transformers        │
│               └─────┬─────┘                              │
│                     │                                     │
│               ┌─────▼─────┐                              │
│               │  Gemini   │ (or OpenAI)                   │
│               │    LLM    │                               │
│               └───────────┘                              │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.136.3
- **Python**: 3.12+
- **Database**: PostgreSQL + SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **LLM**: Google Gemini (free tier) / OpenAI
- **RAG**: LangChain + ChromaDB + Sentence Transformers
- **Transcripts**: youtube-transcript-api

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- **Python 3.12+**
- **Node.js 18+** and npm
- **PostgreSQL 16** (running locally)
- **Gemini API Key** (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone & Setup Database

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE youtube_companion;
\q
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux

# Edit .env with your settings:
# - DATABASE_URL (your PostgreSQL connection string)
# - GEMINI_API_KEY (from Google AI Studio)

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with docs at `http://localhost:8000/docs`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## 📡 API Reference

All endpoints are prefixed with `/api/v1`.

### Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/videos/process` | Process a YouTube video |
| `GET` | `/videos/{video_id}` | Get video details |
| `GET` | `/videos/` | List all videos |

#### Process Video
```bash
curl -X POST http://localhost:8000/api/v1/videos/process \
  -H "Content-Type: application/json" \
  -d '{"youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "youtube_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "youtube_video_id": "dQw4w9WgXcQ",
  "title": "Video Title",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/videos/{video_id}/notes` | Generate study notes |
| `GET` | `/videos/{video_id}/notes` | Get existing notes |

### Flashcards

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/videos/{video_id}/flashcards` | Generate 20 flashcards |
| `GET` | `/videos/{video_id}/flashcards` | Get existing flashcards |

### Quiz

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/videos/{video_id}/quiz` | Generate 10 MCQs |
| `GET` | `/videos/{video_id}/quiz` | Get existing quiz |

### Chat (RAG)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/videos/{video_id}/chat` | Ask a question |
| `GET` | `/videos/{video_id}/chat/history` | Get chat history |

#### Ask a Question
```bash
curl -X POST http://localhost:8000/api/v1/videos/{video_id}/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic discussed?"}'
```

**Response:**
```json
{
  "answer": "The main topic discussed is...",
  "sources": [
    {
      "text": "Relevant transcript segment...",
      "start_time": 120.5,
      "end_time": 135.0
    }
  ],
  "video_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Check API health |

## 📁 Project Structure

```
Utube/
├── README.md
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── alembic.ini
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── api/              # Route handlers
│   │   ├── core/             # Config, logging, exceptions
│   │   ├── db/               # Database engine & base models
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── repositories/     # Database CRUD operations
│   │   ├── services/         # Business logic
│   │   ├── rag/              # RAG pipeline (chunking, embeddings, retrieval)
│   │   └── utils/            # YouTube helpers
│   └── tests/
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── api/              # API client
        ├── components/       # UI components
        ├── pages/            # Page components
        └── types/            # TypeScript interfaces
```

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL connection string |
| `LLM_PROVIDER` | `gemini` | LLM provider (`gemini` or `openai`) |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `OPENAI_API_KEY` | — | OpenAI API key (if using OpenAI) |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model name |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model name |
| `CHROMA_PERSIST_DIR` | `./chroma_data` | ChromaDB storage directory |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence Transformer model |
| `LOG_LEVEL` | `INFO` | Logging level |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |

## 🧪 Running Tests

```bash
cd backend
pytest tests/ -v
```

## 📝 Database Migrations

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
