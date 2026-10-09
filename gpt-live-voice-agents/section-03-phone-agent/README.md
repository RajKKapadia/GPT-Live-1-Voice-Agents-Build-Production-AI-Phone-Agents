# Section 3: Phone Agent

A phone voice agent using Twilio Media Streams and GPT-Live. Requires Bun, an OpenAI API key, a voice-enabled Twilio number, and [ngrok installed and connected to your account](https://ngrok.com/docs/share-localhost/quickstart).

## Setup

In this section directory, run:

```bash
bun install
cp -n .env.example .env
```

In a second terminal, start ngrok and leave it running:

```bash
ngrok http 3000
```

Edit `.env` with your API key and the HTTPS forwarding URL printed by ngrok:

```dotenv
PORT=3000
OPENAI_API_KEY=sk-your-key-here
PUBLIC_BASE_URL=https://your-domain.ngrok.dev
```

Use only the base URL, without a trailing slash or endpoint path.

## Run

In the first terminal:

```bash
bun run index.ts
```

In your Twilio number's voice configuration, set the incoming-call handler to **Webhook**, use your ngrok URL followed by `/voice/incoming`, select **HTTP POST**, and save.

Call your Twilio number while the server and ngrok are running. The code uses a fixed demo caller mapped to customer `CUS-1001`.

Run one section at a time; the default port is `3000`. If the tunnel URL changes, update `.env` and the Twilio webhook, then restart the server. Hang up and stop both processes with **Ctrl+C** when finished.

[Course README](../../README.md)
