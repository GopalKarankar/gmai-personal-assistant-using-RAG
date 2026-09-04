# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Frontend (`frontend/`):

```bash
npm ci            # install (lockfile-exact)
npm run dev       # Vite dev server on :5173
npm run build     # production build to dist/
npm run lint      # ESLint (flat config, eslint.config.js)
npm run preview   # serve the built dist/
```

Backend (`backend/`):

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1          # PowerShell; use .venv/bin/activate on POSIX
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Swagger UI at `http://127.0.0.1:8000/docs`.

There is no test suite in either project — no pytest/vitest/jest is configured, so "run the tests" has no target yet.

## Required configuration

`backend/.env` must define `NVIDIA_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY`, `GROQ_API_KEY`, and `CORS_ORIGINS`. `.env.example` holds only the tunable defaults, not these secrets. `CLEANUP_SECRET` is required only if `/cleanup` is used.

`frontend/.env.local` must define `VITE_GOOGLE_CLIENT_ID` and `VITE_BACKEND_URL`. The Google OAuth client needs the Gmail API enabled and `http://localhost:5173` in its authorized JavaScript origins.

## Architecture

Two independently deployed services. The browser — not the backend — talks to Gmail.

```
Browser (React) --OAuth token--> Gmail API          (fetch messages)
Browser --multipart /upload--> FastAPI --> NVIDIA embeddings --> Qdrant
Browser --POST /chat--------> FastAPI --> Qdrant search --> Groq --> answer + sources
```

The backend never holds a Gmail credential and is fully stateless; all durable state lives in Qdrant. Consequences worth knowing before changing anything:

- **The access token is deliberately not persisted.** `gmailAccessTokenStore` is plain Zustand (memory only); `gmailAuthStore` is `persist`-wrapped to localStorage under `gmail-auth-storage`. After a page refresh the profile survives but the token does not, so `Chat.jsx` detects the missing token, alerts "Session expired", and redirects to `/`. This is by design, not a bug to "fix" by persisting the token.
- **`hasVisited` is the auto-sync latch.** It gates the one-time sync after login; login and logout both reset it to `false`.
- **Point IDs are `uuid5(NAMESPACE_URL, "gmail-message:<gmail id>")`** (`stable_point_id`), so re-uploading the same message upserts rather than duplicates. Never switch to random IDs.
- **`QDRANT_VECTOR_SIZE` must match the embedding model's output** (2048 for `nvidia/nemotron-3-embed-1b`). `embed_texts` hard-fails with a 500 on a mismatch. `backend/cleanup_qdrant.py` reads `QDRANT_VECTOR_SIZE` from the environment, so no manual hardcoding is needed.
- **Only metadata reaches Qdrant.** `gmail_message_payload` deliberately strips encoded bodies and attachments; `message_text` (Subject/From/Date/Snippet) is what gets embedded. Keep that boundary when extending the payload.
- **Qdrant writes are batched and retried** (`upsert_points`, `QDRANT_UPSERT_BATCH_SIZE` / `QDRANT_UPSERT_RETRIES` with exponential backoff) because free-tier gateways time out on large writes.
- **`MAX_MESSAGES_PER_UPLOAD` (50) mirrors the frontend's `maxResults: 50`.** Raising one without the other produces 413s.
- **The Groq system prompt treats email content as untrusted data, never instructions** (`answer_with_groq`). Preserve that when editing the prompt.

### Optional-dependency loading in `backend/main.py`

`_load_optional_dependencies()` imports `langchain_nvidia_ai_endpoints` and `qdrant_client` via `importlib` and swallows `ImportError`, binding module-level names to `None`. The app therefore starts and `/health` passes even with the RAG stack uninstalled; `require_vector_dependencies()` converts the missing import into a 500 at request time. So an unmet dependency shows up as a runtime API error, not a startup crash.

### Runtime env indirection

Frontend code reads config through `getRuntimeEnv()` (`src/config/runtimeEnv.js`), which prefers `window.__APP_CONFIG__` over `import.meta.env`. `public/runtime-config.js` is loaded by a plain `<script>` in `index.html` before the module bundle; in the Docker image, `runtime-env.sh` runs as an nginx entrypoint hook and rewrites that file from container env vars. That is why `VITE_BACKEND_URL` and `VITE_GOOGLE_CLIENT_ID` can change without a rebuild. Always add new frontend config via `getRuntimeEnv` plus both `runtime-config.js` and `runtime-env.sh`, never bare `import.meta.env`.

Both `Chat.jsx` and `GmailMessagesSection.jsx` duplicate a backend-URL fallback chain (configured value → current origin with `:5173`→`:8000` → `http://127.0.0.1:8000`). Change both together, or lift it into `runtimeEnv.js`.

## Auth: two systems, one active

Real sign-in is `useGoogleLogin` from `@react-oauth/google` in `Navbar.jsx` (implicit flow, scope `gmail.readonly`), followed by a call to the Google userinfo endpoint. Firebase (`src/config/firebase.js`, hardcoded config) is initialized only so `handleSignOut` can call `signOut(auth)`; no Firebase user is ever created. Treat Firebase as vestigial — do not build on it.

`/` is the sign-in landing page (`SignInWithGoogle.jsx`, marketing copy only — the login button lives in the Navbar). Routes are unguarded; `Chat.jsx` does its own token check.

## Currently unwired code

`GmailMessagesSection.jsx` (and with it `MessageList.jsx`, `MessageDetailsModal.jsx`, `hooks/useClickOutside.jsx`) is imported by nothing. The inbox-browser flow the README describes is not reachable in the running app — `Chat.jsx` contains the live, more robust sync (429 retry with `Retry-After`, concurrency limit, abort, upload progress). If asked to restore the inbox list, wire `GmailMessagesSection` into `Homepage.jsx`; if asked to change sync behavior, edit `Chat.jsx`.

## Gotchas

- Root `babel.json` is **not** a Babel config — it is a backup manifest from an unrelated "Babel" desktop app that happens to sit in this repo (and shows as modified in git). Build-time Babel is configured in `frontend/vite.config.js`, which runs the React Compiler preset through `@rolldown/plugin-babel`.
- `POST /cleanup` deletes every point in the collection, gated only by the `X-Cleanup-Secret` header against `CLEANUP_SECRET`. Note it builds the Qdrant client *before* checking the secret.
- `render.yaml` service names (`gmail-personal-assistant-*`) differ from the hardcoded CORS default in `main.py` (`gmail-pa-frontend.onrender.com`); deployment relies on the `CORS_ORIGINS` env var overriding that default.
- Despite the "non-dockerised" directory name, both Dockerfiles and the Render blueprint are live and expected to keep working.
