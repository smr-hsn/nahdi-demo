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
IDRAK_API_KEY=your_public_agent_bearer_key
IDRAK_AGENT_ID=agt-1791273705542-awzfqk
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
- Voice needs microphone permission and a Chromium-based browser for the most reliable LiveKit audio.
- This is a demo, not medical advice. Product names and links appear only when the agent returns them.
