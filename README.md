# Skincare AI Advisor (IDRAK demo)

Single-page luxury skincare landing page with a floating IDRAK text + voice assistant.

## Local setup

1. Install Node.js 20+.
2. Copy environment variables:

```bash
cp .env.example .env
```

3. Set **server-only** secrets in `.env` (never use a `VITE_` prefix):

```
IDRAK_BASE_URL=https://idrak.bilyticaglobal.com
IDRAK_CHAT_API_KEY=your_chat_bearer_key
REALTIME_TOKEN_API_KEY=your_realtime_token_service_key
VOICE_TOKEN_BASE_URL=https://voice-realtime.bilyticaglobal.com
```

4. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:5173/

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local demo with the IDRAK proxy |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build (proxy still attached) |
| `npm run lint` | Oxlint |

## Notes

- The browser talks only to `/api/assistant/*`. The IDRAK bearer key stays on the server.
- Chat sends `{ question, session_id, temperature }` to `/api/public/agents/ask` with `IDRAK_CHAT_API_KEY` as a Bearer token. It falls back to `IDRAK_API_KEY` if no chat-specific key is set.
- Voice sends `{ user_id, session_id }` to `/api/assistant/voice/session`, then requests a LiveKit token from `/realtime/token` using `REALTIME_TOKEN_API_KEY` (or `VOICE_SERVER_API_KEY`) and `VOICE_TOKEN_BASE_URL` (or `VOICE_SERVER_BASE_URL`).
- Voice needs microphone permission and a Chromium-based browser for the most reliable LiveKit audio.
- This is a demo, not medical advice. Product names and links appear only when the agent returns them.
