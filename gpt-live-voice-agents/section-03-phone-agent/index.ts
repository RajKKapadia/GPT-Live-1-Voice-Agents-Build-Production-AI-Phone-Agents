import express from "express"
import { createServer } from "node:http"
import { WebSocketServer } from "ws"
import OpenAI from "openai"
import { LiveWS } from "openai/resources/live/ws"

import { getOrder, getOrderTool } from "./tools/get-order"
import type { ResponseOutputItem } from "openai/resources/responses/responses.js"

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

const customers = [
    {
        id: "CUS-1001",
        name: "Alex Johnson",
        phone: "+91123456789",
    },

    {
        id: "CUS-1002",
        name: "Sarah Williams",
        phone: "+1234567890",
    },
]

export type CallContext = {
    callSid: string
    streamSid?: string
    liveSessionId?: string
    callerNumber?: string
    customerId: string
    customerName: string
}

type TwilioEvent =
    | {
        event: "connected"
    }
    | {
        event: "start"
        start: {
            streamSid: string
            callSid: string
            customParameters?: Record<string, string>
        }
    }
    | {
        event: "media"
        media: {
            payload: string
        }
    }
    | {
        event: "stop"
    }


function findCustomerByPhone(
    phone: string
) {
    return customers.find(
        (customer) =>
            customer.phone === phone
    )
}

type GetOrderArgs = {
    orderId: string
}

function parseGetOrderArgs(
    raw: string
): GetOrderArgs {
    const value: unknown = JSON.parse(raw)

    if (
        typeof value !== "object" ||
        value === null ||
        !("orderId" in value) ||
        typeof value.orderId !== "string"
    ) {
        throw new Error(
            "Invalid get_order arguments"
        )
    }

    return {
        orderId: value.orderId,
    }
}

wss.on("connection", (twilioWs) => {

    console.log("Twilio WebSocket connected")

    let streamSid: string

    let live: LiveWS
    let liveStarted = false

    const pendingAudio: string[] = []

    function connectToOpenAI(callContext: CallContext) {

        console.log("Connection to openai")

        const instructions = `
You are the Orbit Supply customer
support phone agent.

Speak naturally, concisely and always use customer name to address them.

Caller Name: ${callContext.customerName}

Customer ID: ${callContext.customerId}

If the caller interrupts you, stop speaking and listen.

For requests requiring verified business information, delegate to the backend.
`

        live = new LiveWS(openai)

        live.socket.on("open", () => {
            console.log("Connected to GPT-Live-1")
            live!.send({
                type: "session.start",

                session: {
                    input: [
                        {
                            role: "developer",
                            type: "message",
                            content: [
                                {
                                    type: "input_text",
                                    text: JSON.stringify(callContext)
                                }
                            ]
                        }
                    ],

                    model: "gpt-live-1",

                    instructions: instructions,

                    audio: {
                        format: {
                            type: "audio/pcmu",
                            rate: 8000,
                        },

                        output: {
                            voice: "marin",
                        },
                    },

                    delegation: {
                        type: "responses",

                        responses: {
                            model: "gpt-5.6-luna",

                            instructions: `You are the backend customer support agent for Orbit Supply.

                                Your job is to reason about customer requests, retrieve verified Orbit Supply business data using the available tools, and return accurate results to the Live voice agent.

                                Never invent business data.

                                Use the available tools whenever the answer depends on Orbit Supply data such as:
                                - orders
                                - shipments
                                - products
                                - returns
                                - customer-specific information`,

                            tools: [getOrderTool],

                            tool_choice: "auto",

                            parallel_tool_calls: true
                        }
                    }
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

            if (event.type === "response.event") {

                if (event.event?.type == "response.output_item.done") {
                    // Handle Function call
                    const item = event.event.item as ResponseOutputItem
                    if (item.type !== "function_call") return
                    console.log(event.event_id)
                    console.log(JSON.stringify(event.event))
                    const { name, arguments: rawArguments, call_id } = item
                    const args = JSON.parse(rawArguments)

                    console.log("Function:", name)
                    console.log("Arguments:", args)
                    console.log("Call ID:", call_id)
                    console.log(callContext)

                    let output

                    if (name === "get_order") {
                        const inputArguments = parseGetOrderArgs(rawArguments)
                        output = JSON.stringify(getOrder(inputArguments.orderId))
                    }

                    if (!output) {
                        output = "I am unable to help you with this request."
                    }

                    live.send({ type: "response.item.create", item: { type: "function_call_output", call_id: call_id, output: output, status: "completed" }, event_id: event.event_id })

                    live.send({ type: "response.create" })
                }
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
        ) as TwilioEvent

        if (event.event === "connected") {
            console.log("Twilio stream connected")
        }

        if (event.event === "start") {
            streamSid = event.start.streamSid

            const params = event.start.customParameters ?? {}

            const callContext = {
                callSid: event.start.callSid,

                streamSid: event.start.streamSid,

                callerNumber: params.callerNumber,

                customerId: params.customerId || "Unknown",

                customerName: params.customerName || "Unknown",
            }

            console.log(
                "Call context:",
                callContext
            )

            console.log(
                "Twilio stream started:",
                streamSid
            )

            connectToOpenAI(callContext)
        }

        if (event.event === "media") {
            const audio = event.media.payload

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

    // const callerNumber = String(req.body.From ?? "")
    const callSid = String(req.body.CallSid ?? "")

    const callerNumber = "+91123456789"

    const customer = findCustomerByPhone(callerNumber)

    console.log(
        "Incoming caller:",
        callerNumber
    )

    console.log(
        "Customer:",
        customer
    )


    const twiml = `
    <Response>
      <Connect>
        <Stream url="${wsUrl}/media-stream" >
            <Parameter
                name="callerNumber"
                value="${callerNumber}"
            />

            <Parameter
                name="callSid"
                value="${callSid}"
            />

            <Parameter
                name="customerId"
                value="${customer?.id ?? ""}"
            />

            <Parameter
                name="customerName"
                value="${customer?.name ?? ""}"
            />
          </Stream>
      </Connect>
    </Response>
  `

    res
        .type("text/xml")
        .send(twiml)
})

app.post("/voice/stream-status", (req, res) => {
    const {
        CallSid,
        StreamSid,
        StreamEvent,
        StreamError,
    } = req.body

    console.log({
        CallSid,
        StreamSid,
        StreamEvent,
        StreamError,
    })

    res.sendStatus(200)
}
)

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})