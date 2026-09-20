# Section 2: Tools and Agents — Backend

Requires Bun and an OpenAI API key. Run from this `backend` directory:

```bash
bun install
cp -n .env.example .env
```

Set `OPENAI_API_KEY` in `.env`, then start the backend:

```bash
bun run index.ts
```

Runs at http://localhost:3000. Keep it running and start the [frontend](../frontend/README.md) in another terminal. Run only one section at a time; both use port 3000.
