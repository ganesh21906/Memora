# Memora AI — Context-Aware Personal Executive Assistant

> Ask one question. Search across all your personal data sources. Get a grounded, cited answer.

---

## Problem Statement

Modern professionals and individuals store their personal information across many disconnected sources — notes apps, spreadsheets, PDF documents, WhatsApp chats, and emails. When they need to recall a fact, track a decision, or resolve a discrepancy, they have to manually open and search each source one by one.

**Key pain points:**
- "How much did I spend on groceries last month?" — requires opening a spreadsheet
- "What did the doctor say in January?" — requires searching through notes or PDFs
- "Does Meena still owe me money?" — requires scrolling through WhatsApp chats
- "What is my current weight?" — might conflict between an old note and a new upload
- No single tool searches all these sources together and gives a synthesized answer
- When the same fact appears in multiple sources with different values, there is no automatic conflict detection

---

## Solution — Memora AI

Memora AI is a **context-aware personal executive assistant** that:

1. **Ingests** all your personal documents (TXT, PDF, CSV, WhatsApp exports, JSON emails)
2. **Chunks and indexes** them into a local semantic vector database (ChromaDB)
3. **Accepts natural language questions** through a modern web UI
4. **Searches all sources simultaneously** using specialized tools per file type
5. **Synthesizes a single grounded answer** using a large language model (Groq / LLaMA 3)
6. **Detects and surfaces data conflicts** when two sources give different values for the same fact
7. **Allows file uploads** at runtime — new files are immediately indexed and searchable

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Next.js Frontend (port 3000)           │
│  ChatInput → /api/query proxy → ResponsePanel          │
│  FileUpload → /api/upload proxy                        │
│  ConflictPanel │ StructuredTruthPanel │ SourceCards    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP
┌────────────────────▼────────────────────────────────────┐
│                FastAPI Backend (port 8000)              │
│                                                         │
│  /query ──► Pre-retrieval Agent                        │
│              │                                          │
│              ├── search_pdf  ──► ChromaDB (type:pdf)   │
│              ├── search_txt  ──► ChromaDB (type:txt)   │
│              ├── search_csv  ──► ChromaDB (type:csv)   │
│              ├── search_whatsapp ► ChromaDB (whatsapp) │
│              └── search_email ──► sample_emails.json   │
│                                                         │
│              All results ──► Groq LLM (LLaMA 3.3 70B) │
│              LLM returns: answer + structured_truth +   │
│                           conflicts (JSON)              │
│                                                         │
│  /upload ──► index_file() ──► ChromaDB                 │
└─────────────────────────────────────────────────────────┘
```

---

## Key Features

| Feature | Description |
|---|---|
| **Multi-source Search** | Searches PDF, TXT, CSV, WhatsApp, and Email simultaneously |
| **Semantic Search** | Uses vector embeddings (ChromaDB) for meaning-based retrieval |
| **Conflict Detection** | Automatically detects when two sources give different values |
| **Structured Truth Panel** | Extracts key facts: decision, budget, evidence, status |
| **File Upload** | Upload new files at runtime — indexed instantly |
| **Follow-up Suggestions** | Context-aware follow-up questions generated per query |
| **Markdown Answers** | Responses rendered with formatting, bold, bullet points |
| **Source Cards** | Each answer shows which sources were searched |
| **Animated UI** | Staggered badges, count-up timer, fade-in answers |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 15** (App Router) | React framework, server-side API proxy routes |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations (stagger, fade, spring) |
| **react-markdown** | Render LLM markdown output |
| **Lucide React** | Icon library |
| **TypeScript** | Type-safe frontend code |

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Python REST API framework |
| **Groq API** | LLM inference (LLaMA 3.3 70B — fast & free tier) |
| **ChromaDB** | Local vector database for semantic search |
| **sentence-transformers** | Text embedding for ChromaDB |
| **PyMuPDF (fitz)** | PDF text extraction |
| **openai SDK** | Groq-compatible API client |

### Data & Storage
| Technology | Purpose |
|---|---|
| **ChromaDB (local)** | Persistent vector store — `data/chroma/` |
| **File system** | Raw data files in `data/`, uploads in `data/uploads/` |
| **IndexedDB (browser)** | Client-side file metadata storage |

---

## Project Structure

```
Memora/
├── app/                        # Next.js App Router
│   ├── api/
│   │   ├── query/route.ts      # Backend proxy + conflict detection
│   │   └── upload/route.ts     # File upload proxy
│   ├── login/                  # Demo auth page
│   └── page.tsx                # Main assistant page
│
├── components/
│   ├── ResponsePanel.tsx        # Main answer display with animations
│   ├── ConflictPanel.tsx        # Data conflict cards
│   ├── StructuredTruthPanel.tsx # Structured facts panel
│   ├── SourceCard.tsx           # Individual source evidence cards
│   ├── FollowUpSuggestions.tsx  # Follow-up query chips
│   ├── FileUploadPanel.tsx      # File upload with IndexedDB
│   ├── ChatInput.tsx            # Query input with sample prompts
│   └── Header.tsx               # Top navigation
│
├── backend/
│   ├── main.py                  # FastAPI app + endpoints
│   ├── agent.py                 # Multi-tool agent + LLM synthesis
│   ├── vector_store.py          # ChromaDB wrapper
│   ├── indexer.py               # File chunking + indexing
│   ├── config.py                # Settings from .env
│   └── tools/
│       ├── pdf_search.py        # PDF semantic search
│       ├── txt_search.py        # Text/notes search
│       ├── csv_search.py        # CSV data search
│       ├── whatsapp_search.py   # WhatsApp chat search
│       ├── email_search.py      # Email JSON search
│       └── attachment_parser.py # Email attachment parsing
│
├── data/
│   ├── personal_notes.txt       # Sample personal diary
│   ├── expenses.csv             # Sample expense records
│   ├── whatsapp_friends.txt     # Sample WhatsApp export
│   ├── monthly_report.pdf       # Sample Q1 2026 progress report
│   └── sample_emails.json       # Sample email records
│
├── lib/
│   └── types.ts                 # TypeScript types (QueryResponse, etc.)
│
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variable template
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- A free [Groq API key](https://console.groq.com)

### 1. Clone the repository

```bash
git clone https://github.com/ganesh21906/Memora.git
cd Memora
```

### 2. Set up environment variables

```bash
# Copy the template
cp .env.example .env.local   # for Next.js frontend
cp .env.example .env          # for Python backend
```

Edit `.env` (backend) and add your Groq API key:
```
GROQ_API_KEY=your_groq_api_key_here
USE_DEMO_MODE=true
```

Edit `.env.local` (frontend):
```
BACKEND_URL=http://localhost:8000
```

### 3. Start the backend

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn backend.main:app --reload
```

The backend will auto-index all files in `data/` on first startup.

### 4. Start the frontend

```bash
# Install Node dependencies
npm install

# Start the Next.js dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How to Use

1. **Login** with any name and email (demo auth — no real credentials needed)
2. **Ask a question** in natural language — e.g. *"How much did I spend on groceries?"*
3. **View the answer** with tool badges showing which sources were searched
4. **Check Conflicts** — if two sources have different values, the Conflict Panel shows both with severity and recommended action
5. **Upload your own files** — drag and drop a PDF, TXT, or CSV; it's indexed instantly
6. **Try follow-up questions** from the suggestions below the answer

### Sample Questions to Try

```
How much did I spend on groceries last month?
What did the doctor say in January?
Does Meena owe me money?
What are my pending tasks for March?
What is my current weight?
Summarize my Q1 2026 progress
```

### Triggering Conflict Detection

Upload a file that contradicts existing data:

```
# health_update.txt
As of March 2026, my weight is 68 kg.
Meena has fully paid back her share of ₹800.
```

Then ask: *"What is my current weight?"* — the Conflict Panel will show both values with severity rating and recommended action.

---

## API Endpoints (Backend)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/query` | Main query — runs agent and returns answer |
| `POST` | `/upload` | Upload and index a file |
| `GET` | `/health` | Health check + mode info |
| `POST` | `/reindex` | Re-index all files in `data/` |
| `GET` | `/vector/status` | ChromaDB chunk count |
| `GET` | `/uploads` | List uploaded files |

---

## Supported File Types

| Format | Tool Used | Notes |
|---|---|---|
| `.pdf` | `search_pdf` | Text extracted via PyMuPDF |
| `.txt` (notes/diary) | `search_txt` | Chunked by paragraph |
| `.txt` (WhatsApp export) | `search_whatsapp` | Detected by content pattern |
| `.csv` | `search_csv` | Row-based chunking |
| `.json` (emails) | `search_email` | Structured field search |
| `.md` | `search_txt` | Treated as plain text |
