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
