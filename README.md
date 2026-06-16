# 🎓 YouTube Learning Companion

Transform any YouTube video into a full interactive study session. Paste a URL and instantly get AI-generated notes, flashcards, quizzes, and a RAG-powered chat — all with timestamp references.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Smart Notes** | AI-generated structured notes with headings, key concepts, and bullet points |
| 🃏 **Flashcards** | 20 Q&A study cards per video shown inline — no flip needed |
| 📋 **Adaptive Quiz** | 10 challenging MCQs with plausible distractors, scoring, and explanations |
| 💬 **RAG Chat** | Ask anything about the video — answers grounded in the transcript with timestamps |
| ⏱️ **Timestamps** | Click-to-seek timestamp links throughout notes and transcripts |
| 📄 **Full Transcript** | Searchable, clickable transcript segments synced to the video player |
| 🕓 **Video History** | Sidebar showing all previously processed videos for quick re-access |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React + TS)                   │
│              Vanilla CSS · Vite · Axios                  │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP (REST API)
┌─────────────────────▼───────────────────────────────────┐
│                  Backend (FastAPI)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Routers  │→ │ Services │→ │  Repos   │→ PostgreSQL   │
│  └──────────┘  └────┬─────┘  └──────────┘               │
│                     │                                     │
│               ┌─────▼─────┐                              │
│               │    RAG    │→ ChromaDB (vector store)     │
│               │ Pipeline  │→ Sentence Transformers        │
│               └─────┬─────┘                              │
│                     │                                     │
│               ┌─────▼─────┐                              │
│               │   Groq    │ (or Gemini / OpenAI)          │
│               │    LLM    │                               │
│               └───────────┘                              │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.136+
- **Python**: 3.12+
- **Database**: PostgreSQL + SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Validation**: Pydantic v2
- **LLM**: Groq (`llama-3.3-70b-versatile`) / Google Gemini / OpenAI
- **RAG**: LangChain + ChromaDB + Sentence Transformers (`all-MiniLM-L6-v2`)
- **Transcripts**: youtube-transcript-api

### Frontend
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- **Python 3.12+**
- **Node.js 18+** and npm
- **PostgreSQL 16** (running locally)
- **Groq API Key** (free at [console.groq.com](https://console.groq.com)) — or use Gemini / OpenAI

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
```

Edit `.env` with your settings — minimum required:

```env
DATABASE_URL=postgresql+asyncpg://postgres:<password>@localhost:5432/youtube_companion

# Choose one LLM provider
LLM_PROVIDER=groq
GROQ_API_KEY=your-groq-key-here
GROQ_MODEL=llama-3.3-70b-versatile
```

```bash
# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

API available at `http://localhost:8000` · Docs at `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`.

## 📡 API Reference

All endpoints are prefixed with `/api/v1`.

### Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/videos/process` | Process a YouTube video |
| `GET` | `/videos/{video_id}` | Get video details |
| `GET` | `/videos/` | List all videos |

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
| `POST` | `/videos/{video_id}/quiz?force=true` | Regenerate a brand-new quiz |
| `GET` | `/videos/{video_id}/quiz` | Get existing quiz |

### Chat (RAG)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/videos/{video_id}/chat` | Ask a question about the video |
| `GET` | `/videos/{video_id}/chat/history` | Get chat history |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Check API status |

## 📁 Project Structure

```
Utube/
├── README.md
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── alembic.ini
│   ├── alembic/              # Database migrations
│   └── app/
│       ├── main.py           # FastAPI entry point
│       ├── api/              # Route handlers
│       ├── core/             # Config, logging, exceptions
│       ├── db/               # Database engine & base models
│       ├── models/           # SQLAlchemy ORM models
│       ├── schemas/          # Pydantic request/response models
│       ├── repositories/     # Database CRUD operations
│       ├── services/         # Business logic + LLM prompts
│       ├── rag/              # RAG pipeline (chunking, embeddings, retrieval)
│       └── utils/            # YouTube helpers
└── frontend/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── api/              # Axios API client
        ├── components/       # UI components
        ├── pages/            # Page-level components
        └── types/            # TypeScript interfaces
```

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | PostgreSQL connection string |
| `LLM_PROVIDER` | `groq` | LLM provider: `groq`, `gemini`, or `openai` |
| `GROQ_API_KEY` | — | Groq API key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model name |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model name |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model name |
| `CHROMA_PERSIST_DIR` | `./chroma_data` | ChromaDB storage directory |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence Transformer model for embeddings |
| `LOG_LEVEL` | `INFO` | Logging verbosity |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |

## 🧪 Running Tests

```bash
cd backend
pytest tests/ -v
```

## 📝 Database Migrations

```bash
cd backend

# Create a new migration after model changes
alembic revision --autogenerate -m "description"

# Apply all pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## 📄 License

This project is licensed under the MIT License.
