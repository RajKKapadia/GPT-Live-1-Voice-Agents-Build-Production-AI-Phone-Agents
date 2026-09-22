import express from "express"
import { createServer } from "node:http"
import { WebSocketServer } from "ws"
import OpenAI from "openai"
import { LiveWS } from "openai/resources/live/ws"

const PORT = Number(process.env.PORT ?? 3000)
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL!

const app = express()

app.use(express.urlencoded({ extended: false }))

const server = createServer(app)

const wss = new WebSocketServer({
    server,
    path: "/media-stream",
})

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

wss.on("connection", (twilioWs) => {

    console.log("Twilio WebSocket connected")

    let streamSid: string | null = null

    let live: LiveWS | null = null
    let liveStarted = false

    const pendingAudio: string[] = []

    function connectToOpenAI() {

        live = new LiveWS(openai)

        live.socket.on("open", () => {
            console.log("Connected to GPT-Live-1")

            live!.send({
                type: "session.start",

                session: {
                    model: "gpt-live-1",

                    instructions: `
You are a helpful customer support phone agent
for Orbit Supply.

Speak naturally and concisely.

You are speaking to the customer over a phone call.

If the customer interrupts you, stop speaking
and listen to them.
          `,

                    audio: {
                        format: {
                            type: "audio/pcmu",
                            rate: 8000,
                        },

                        output: {
                            voice: "marin",
                        },
                    },
                },
            })
        })

        live.on("event", (event) => {
            if (event.type === "session.started") {
                console.log(
                    "GPT-Live session started:",
                    event.session.id
                )

                liveStarted = true

                for (const audio of pendingAudio) {
                    live!.send({
                        type: "session.input_audio.append",
                        audio,
                    })
                }

                pendingAudio.length = 0
            }

            if (
                event.type === "session.output_audio.delta" &&
                streamSid
            ) {
                twilioWs.send(
                    JSON.stringify({
                        event: "media",
                        streamSid,

                        media: {
                            payload: event.delta,
                        },
                    })
                )
            }

            if (event.type === "error") {
                console.error(
                    "OpenAI error:",
                    event.error
                )
            }

            if (event.type === "session.closed") {
                console.log("GPT-Live session closed")
            }
        })
    }

    twilioWs.on("message", (message) => {
        const event = JSON.parse(
            message.toString()
        )

        if (event.event === "connected") {
            console.log("Twilio stream connected")
        }

        if (event.event === "start") {
            streamSid = event.start.streamSid

            console.log(
                "Twilio stream started:",
                streamSid
            )

            connectToOpenAI()
        }

        if (event.event === "media") {
            const audio =
                event.media.payload

            if (liveStarted && live) {
                live.send({
                    type: "session.input_audio.append",
                    audio,
                })
            } else {
                pendingAudio.push(audio)
            }
        }

        if (event.event === "stop") {
            console.log("Twilio stream stopped")

            if (live) {
                live.send({
                    type: "session.close",
                })
            }
        }
    })

    twilioWs.on("close", () => {
        console.log(
            "Twilio WebSocket disconnected"
        )
    })
})

app.post("/voice/incoming", (req, res) => {
    const wsUrl = PUBLIC_BASE_URL.replace(
        /^https:/,
        "wss:"
    )

    console.log(req.body)

    const twiml = `
    <Response>
      <Connect>
        <Stream url="${wsUrl}/media-stream" />
      </Connect>
    </Response>
  `

    res
        .type("text/xml")
        .send(twiml)
})

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})