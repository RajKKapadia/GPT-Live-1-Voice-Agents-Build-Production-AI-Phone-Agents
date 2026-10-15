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

## Testing Questions

Try these questions during a call. The demo caller is `CUS-1001`, whose sample orders are `ORD-1001` (processing) and `ORD-1002` (shipped).

| What to ask | What to check |
| --- | --- |
| "What is the status of order ORD-1001?" | Reports that the order is processing. |
| "What did I buy in order ORD-1001, and what was the total?" | Looks up the mechanical keyboard and order total. |
| "Where is order ORD-1002? Can you give me its tracking number?" | Retrieves the FedEx shipment status and tracking number. |
| "Do you have mechanical keyboards in stock?" | Finds the keyboard and reports its availability. |
| "Is the Orbit USB-C Hub available?" | Reports that the hub is out of stock. |
| "Do you sell gaming monitors?" | Explains that no matching product was found. |
| "Can you check order ORD-9999?" | Explains that the order was not found. |
| "Has a return been requested for order ORD-1001?" | Reports that no return request exists. |
| "Can you change the delivery address for order ORD-1001?" | Collects the full address and asks for confirmation before changing it. |
| "Can you change the delivery address for order ORD-1002?" | Explains that the shipped order is ineligible when the confirmed change is attempted. |
| "I want to return order ORD-1001 because I ordered the wrong keyboard." | Asks for confirmation, then explains that only delivered orders can be returned. |
| "Can you check ORD-1001 and track ORD-1002?" | Handles both lookups and returns both results without a pending-tool-results error. |
| "Can I speak to a human support agent?" | Creates an escalation case in the server logs; this demo does not transfer the phone call. |

For address changes, use a sample address such as **42 Lake Road, Austin, TX 78701, US, with no apartment number**. After the agent asks for confirmation, try **"Yes, please confirm that change"**. In a separate attempt, try **"No, do not change it"** and check that the address stays unchanged.

Watch the server terminal for tool execution and errors. Demo data changes are held in memory and reset when the server restarts; shipment dates are fixed sample data.

[Course README](../../README.md)
