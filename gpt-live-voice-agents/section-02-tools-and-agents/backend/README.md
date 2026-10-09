# Section 2: Tools and Agents — Backend

Requires [Bun](https://bun.sh/docs/installation) and an OpenAI API key with access to `gpt-live-1` and `gpt-5.6-luna`. Run from this `backend` directory:

```bash
bun install
cp -n .env.example .env
```

Set `OPENAI_API_KEY` in `.env`, then start the backend:

```bash
bun run index.ts
```

Runs at http://localhost:3000. Check http://localhost:3000/health for `{"status":"ok"}`. Keep it running and start the [frontend](../frontend/README.md) in another terminal.

The tools use local demo data; no database setup is needed. Inspect the demo orders at http://localhost:3000/api/debug/orders.

Run one course section at a time; all backends use port `3000` by default. Restart the backend after changing `.env`; stop it with **Ctrl+C**.

[Section run guide](../README.md)
