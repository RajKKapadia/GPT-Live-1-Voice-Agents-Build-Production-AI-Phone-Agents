# Section 2: Tools and Agents

A browser voice agent with tools and specialist agents using local demo data. Requires Bun, an OpenAI API key, and a microphone.

Start both terminals in this section directory.

## Backend — terminal 1

```bash
cd backend
bun install
cp -n .env.example .env
```

Set `OPENAI_API_KEY` in the backend's `.env`, then run:

```bash
bun run index.ts
```

## Frontend — terminal 2

```bash
cd frontend
bun install
bun run dev
```

Keep both servers running. Open the URL printed by Vite (usually http://localhost:5173), click **Start Conversation**, and allow microphone access.

Run one section at a time; the backend uses port `3000`. Click **End Conversation** when finished and stop the servers with **Ctrl+C**.

[Course README](../../README.md)
