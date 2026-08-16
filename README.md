# Gmail Personal Assistant

An AI-powered Gmail workspace for reviewing an inbox and asking questions about synced email. The application retrieves Gmail messages in the browser (with the user's consent), stores searchable embeddings in Qdrant, and uses Groq to generate answers grounded in the retrieved messages.

## Features

- Google OAuth sign-in with read-only Gmail access
- Inbox browser with refresh, pagination, message details, and manual sync
- Automatic sync of up to 50 Gmail messages after sign-in
- Semantic search over synced email metadata (subject, sender, date, and snippet)
- Grounded inbox chat with source messages returned by the API
- Retry, cancellation, and progress handling for inbox sync and chat requests
- Docker and Render configuration for separate frontend and backend deployments

## Architecture

```text
React + Vite frontend
        |
        | Google OAuth + Gmail API (read-only)
        v
FastAPI API ----> NVIDIA Embeddings ----> Qdrant vector database
        |
        v
   Groq chat completion API
```

The frontend fetches messages directly from the Gmail API using the signed-in user's access token. It uploads message metadata to the FastAPI service, which creates embeddings and upserts them into Qdrant. When a question is asked, the backend retrieves relevant messages from Qdrant and asks Groq to answer using only that retrieved context.

## Tech stack

- **Frontend:** React 19, Vite, React Router, Zustand, Tailwind CSS, Axios
- **Backend:** FastAPI, Uvicorn, HTTPX
- **Authentication and email access:** Google OAuth and Gmail API
- **AI and retrieval:** NVIDIA embeddings, Qdrant, Groq
- **Deployment:** Docker, Nginx, Render

## Project structure

```text
.
|-- frontend/             # React/Vite application
|   |-- src/pages/        # Landing, inbox, chat, and profile pages
|   |-- src/components/   # Navbar, message list, and message-detail UI
|   `-- Dockerfile        # Production build served by Nginx
|-- backend/
|   |-- main.py           # FastAPI routes and RAG pipeline
|   |-- requirements.txt
|   `-- Dockerfile
|-- .env.example          # Backend configuration defaults
`-- render.yaml           # Render blueprint for both services
```

## Prerequisites

- Node.js 22+ and npm
- Python 3.11+
- A Google Cloud OAuth client configured for the Gmail API
- A Qdrant instance and API key (Qdrant Cloud or self-hosted)
- NVIDIA API key for embeddings
- Groq API key for chat completions

## Local setup

### 1. Configure the backend

Create `backend/.env` (or place these values in a root `.env`) and add:

```env
NVIDIA_API_KEY=your_nvidia_api_key
QDRANT_URL=https://your-qdrant-instance
QDRANT_API_KEY=your_qdrant_api_key
GROQ_API_KEY=your_groq_api_key
CORS_ORIGINS=http://localhost:5173

# Optional settings
QDRANT_COLLECTION=gmail_messages
QDRANT_VECTOR_SIZE=1024
MAX_MESSAGES_PER_UPLOAD=50
QDRANT_TIMEOUT_SECONDS=120
QDRANT_UPSERT_BATCH_SIZE=10
QDRANT_UPSERT_RETRIES=3
CHAT_CONTEXT_LIMIT=30
GROQ_TIMEOUT_SECONDS=60
GROQ_MODEL=llama-3.3-70b-versatile
NVIDIA_EMBEDDING_MODEL=nvidia/nv-embedqa-e5-v5
```

Install dependencies and start the API:

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://127.0.0.1:8000`. Visit `http://127.0.0.1:8000/docs` for the interactive API documentation.

### 2. Configure the frontend

Create `frontend/.env.local`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_BACKEND_URL=http://127.0.0.1:8000
```

In Google Cloud Console, enable the Gmail API and add `http://localhost:5173` to the OAuth client's authorized JavaScript origins.

Then start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`), sign in with Google, and allow the `gmail.readonly` permission. The first session syncs up to 50 messages; you can also trigger a sync from the inbox UI.

## API

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | Returns the service health status. |
| `POST` | `/upload` | Accepts a multipart `messages` JSON file containing Gmail message objects; embeds and upserts them. |
| `POST` | `/chat` | Retrieves relevant messages and returns a grounded answer plus source metadata. |
| `POST` | `/cleanup` | Deletes all points in the configured Qdrant collection. Requires the `X-Cleanup-Secret` header and `CLEANUP_SECRET`. |

Example chat request:

```json
{
  "question": "Which invoices arrived this week?",
  "filter_id": "optional-gmail-message-id"
}
```

## Docker

Build and run each service independently:

```bash
docker build -t gmail-assistant-api ./backend
docker run --rm -p 8000:8000 --env-file backend/.env gmail-assistant-api

docker build -t gmail-assistant-web ./frontend
docker run --rm -p 8080:80 \
  -e VITE_BACKEND_URL=http://localhost:8000 \
  -e VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id \
  gmail-assistant-web
```

The frontend image generates its runtime configuration when it starts, so `VITE_BACKEND_URL` and `VITE_GOOGLE_CLIENT_ID` can be changed without rebuilding the image.

## Deploying on Render

The repository includes [`render.yaml`](render.yaml), which provisions separate Docker web services for the API and frontend.

1. Create a Render Blueprint from this repository.
2. Set `NVIDIA_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, and `GROQ_API_KEY` for the backend service.
3. Set `VITE_GOOGLE_CLIENT_ID` for the frontend service.
4. Confirm `CORS_ORIGINS` contains the deployed frontend URL and `VITE_BACKEND_URL` contains the deployed backend URL.
5. Add the deployed frontend URL to the Google OAuth client's authorized JavaScript origins.

## Privacy and security notes

- The app requests the `gmail.readonly` OAuth scope; it does not send or modify email.
- The backend stores selected Gmail fields, including message headers, snippets, and metadata, in Qdrant for retrieval. Choose a Qdrant deployment and retention policy appropriate for your data.
- Keep API keys, Qdrant credentials, and `CLEANUP_SECRET` out of source control. Use `.env` files only for local development and platform-managed environment variables in production.
- The `/cleanup` endpoint is destructive. Set a strong `CLEANUP_SECRET` before enabling or exposing it.

## Scripts

Frontend commands:

```bash
cd frontend
npm run dev      # Start Vite development server
npm run build    # Create production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## License

No license has been specified. Add a license file before distributing or reusing this project publicly.
