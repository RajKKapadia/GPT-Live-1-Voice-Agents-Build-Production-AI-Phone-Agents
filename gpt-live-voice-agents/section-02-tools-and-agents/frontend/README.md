# Section 2: Tools and Agents — Frontend

Requires [Bun](https://bun.sh/docs/installation) and the [backend](../backend/README.md) running at http://localhost:3000. In another terminal, run from this `frontend` directory:

```bash
bun install
bun run dev
```

Open the URL printed by Vite (usually http://localhost:5173), click **Start Conversation**, and allow microphone access. Keep the frontend and backend running during the conversation.

Try asking, "What is the status of order ORD-1001?" Click **End Conversation** when finished; stop the frontend with **Ctrl+C**. The frontend proxies `/api` requests to the backend and needs no API key or `.env` file.

[Section run guide](../README.md)
