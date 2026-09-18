import OpenAI from "openai"

if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required")
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const server = Bun.serve({
    port: 3000,

    async fetch(request) {
        const url = new URL(request.url)

        if (url.pathname === "/health") {
            return Response.json({
                status: "ok",
            })
        }

        if (
            request.method === "POST" &&
            url.pathname === "/api/session"
        ) {
            const body = (await request.json()) as {
                sdp?: string
            }

            if (!body.sdp) {
                return Response.json(
                    {
                        error: "SDP is required",
                    },
                    {
                        status: 400,
                    }
                )
            }

            try {
                const result = await openai.live.create({
                    session: {
                        model: "gpt-live-1",
                        instructions: `You are a friendly voice assistant. Keep your responses conversational and concise. Speak naturally. Do not give unnecessarily long responses.`,
                    },

                    transport: {
                        type: "webrtc",
                        sdp: body.sdp,
                    },
                })

                return Response.json(result, {
                    status: 201,
                })
            } catch (error) {
                console.error(error)

                return Response.json(
                    {
                        error: "Failed to create session",
                    },
                    {
                        status: 500,
                    }
                )
            }
        }

        return new Response("Not Found", {
            status: 404,
        })
    },
})

console.log(`Backend running at http://localhost:${server.port}`)