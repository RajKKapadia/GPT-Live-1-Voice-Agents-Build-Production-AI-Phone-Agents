import express from "express"
import { createServer } from "node:http"
import { WebSocketServer } from "ws"
import OpenAI from "openai"
import { LiveWS } from "openai/resources/live/ws"
import twilio from "twilio"

import { getOrderTool } from "./tools/get-order"

import { handleSidebandEvent } from "./sideband/index"
import { getShipmentTool } from "./tools/get-shipment";
import { searchProductsTool } from "./tools/search-products";
import { getReturnStatusTool } from "./tools/get-return-status";
import { requestReturnTool } from "./tools/request-return";
import { changeOrderAddressTool } from "./tools/change-order-address";
import { confirmActionTool } from "./tools/confirm-action";
import { delegateToSpecialistTool } from "./tools/delegate-to-specialist";
import { escalateToHumanTool } from "./tools/escalate-to-human";

const PORT = Number(process.env.PORT ?? 3000)
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL!

const app = express()

app.use(express.urlencoded({ extended: false }))

const server = createServer(app)

const wss = new WebSocketServer({
    server,
    path: "/media-stream",
})

const client = new OpenAI({
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
    streamSid: string
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

wss.on("connection", (twilioWs) => {

    console.log("Twilio WebSocket connected")

    let streamSid: string

    let liveWs = new LiveWS(client)
    let liveWsStarted = false

    const pendingAudio: string[] = []

    function connectToOpenAI(callContext: CallContext) {

        console.log("Connecting to openai")

        const instructions = `You are the voice customer support agent for Orbit Supply.

                        Speak naturally and concisely with the customer.

                        When the customer's request requires Orbit Supply business data,
                        backend reasoning, or a business action, delegate the request to
                        the Responses backend.

                        Examples include:
                        - checking an order
                        - checking shipment status
                        - searching inventory
                        - checking a return
                        - requesting a return
                        - changing an address

                        Do not invent business information.

                        For ordinary conversational questions that do not require business
                        data, respond directly.

                        When the backend reports confirmation_required:
                        - explain the exact action
                        - ask for explicit confirmation
                        - only after confirmation should the action continue`

        liveWs.socket.on("open", () => {
            console.log("Connected to GPT-Live-1")
            liveWs.send({
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
                            model: "gpt-6-luna",

                            instructions: `You are the backend customer support agent for Orbit Supply.

                                Your job is to reason about customer requests, retrieve verified Orbit Supply business data using the available tools, and return accurate results to the Live voice agent.

                                Never invent business data.

                                Use the available tools whenever the answer depends on Orbit Supply data such as:
                                - orders
                                - shipments
                                - products
                                - returns
                                - customer-specific information

                                For example:
                                - use get_order for order details or order status
                                - use get_shipment for shipping or delivery information
                                - use search_products for product searches
                                - use get_return_status for existing return requests

                                READ-ONLY TOOLS

                                Read-only tools may be used immediately whenever they are needed to answer the customer's request.

                                Always prefer verified tool data over assumptions or conversation memory.

                                SENSITIVE WRITE OPERATIONS

                                Sensitive write operations may return:

                                "confirmation_required"

                                When this happens:

                                1. Do not perform the action yet.
                                2. Return a clear explanation of the exact action requiring confirmation.
                                3. Allow the Live agent to ask the customer for explicit confirmation.
                                4. Do not call confirm_action until explicit customer confirmation has been provided.
                                5. Never treat silence, unrelated statements, or ambiguous language as confirmation.

                                Do not report that a sensitive action succeeded until confirm_action returns a successful result.

                                TOOL FAILURES

                                Never expose:
                                - raw backend errors
                                - stack traces
                                - internal error codes
                                - JSON implementation details
                                - HTTP errors
                                - database errors
                                - internal system details

                                Use the human-readable message returned by the tool.

                                For retryable errors:
                                - briefly explain the problem
                                - retry at most once when reasonable

                                If a tool repeatedly fails or returns escalationRecommended=true, use escalate_to_human.

                                For non-retryable errors:
                                - explain the problem conversationally
                                - request corrected information when appropriate

                                SPECIALISTS

                                Use delegate_to_specialist only when the request benefits from deeper domain-specific reasoning.

                                Available specialists:
                                - order
                                - refund
                                - product

                                Specialists provide recommendations or analysis.

                                You remain responsible for using the appropriate business tools and returning verified information.

                                Do not delegate simple lookups to a specialist when a direct tool can answer the request.

                                Examples:
                                - "What is the status of order ORD-1001?" → use get_order
                                - "Where is ORD-1001?" → use get_shipment
                                - "Do you have wireless keyboards in stock?" → use search_products
                                - "What is happening with my return for ORD-1001?" → use get_return_status

                                HUMAN ESCALATION

                                Use escalate_to_human when:
                                - the customer explicitly requests a human
                                - the requested action cannot be performed with the available permissions or tools
                                - a tool repeatedly fails
                                - escalationRecommended=true
                                - the issue is too sensitive or complex to resolve safely

                                Provide:
                                - a concise summary of the conversation
                                - the unresolved problem
                                - any relevant verified information already collected

                                Do not claim that the customer has been transferred unless escalate_to_human succeeds.

                                GENERAL RULES

                                Do not invent:
                                - order status
                                - shipment status
                                - delivery dates
                                - tracking numbers
                                - product availability
                                - return status
                                - customer information
                                - action results

                                When business data is required, call the appropriate tool before answering.`,

                            tools: [
                                getOrderTool,
                                getShipmentTool,
                                searchProductsTool,
                                getReturnStatusTool,
                                requestReturnTool,
                                changeOrderAddressTool,
                                confirmActionTool,
                                delegateToSpecialistTool,
                                escalateToHumanTool,
                            ],

                            tool_choice: "auto",

                            parallel_tool_calls: true
                        }
                    }
                },
            })
        })

        liveWs.on("event", async (event) => {
            if (event.type === "session.started") {
                console.log("GPT-Live session started:", event.session.id)

                for (const audio of pendingAudio) {
                    liveWs.send({
                        type: "session.input_audio.append",
                        audio,
                    })
                }

                liveWsStarted = true
                callContext.liveSessionId = event.session.id

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
                try {
                    await handleSidebandEvent(liveWs, event, { customerId: callContext.customerId, sessionId: callContext.liveSessionId as string })
                } catch (error) {
                    console.error(
                        "Sideband message error:",
                        error
                    )
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

        liveWs.on("error", (error) => {
            console.log(`Error on OpenAI Websocket: ${error.message}`)
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

            console.log("Call context:", callContext)

            console.log("Twilio stream started:", streamSid)

            connectToOpenAI(callContext)
        }

        if (event.event === "media") {

            if (liveWsStarted && streamSid) {
                liveWs.send({
                    type: "session.input_audio.append",
                    audio: event.media.payload,
                })
            } else {
                pendingAudio.push(event.media.payload)
            }
        }

        if (event.event === "stop") {
            console.log("Twilio stream stopped")

            if (liveWs) {
                liveWs.send({
                    type: "session.close",
                })
            }
        }
    })

    twilioWs.on("error", (error) => {
        console.log(`Twilio error: ${error.message}`)
    })

    twilioWs.on("close", () => {
        console.log(
            "Twilio WebSocket disconnected"
        )
    })
})

app.get("/", (req, res) => {
    res.status(200).json({ message: "Okay" })
})

app.post("/voice/incoming", (req, res) => {
    /**
     * Validate the request
     */

    const twilioSignature = req.headers["x-twilio-signature"]

    const isValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN as string,
        twilioSignature as string,
        `${PUBLIC_BASE_URL}/voice/incomin`,
        req.body
    )

    if (!isValid) {
        res.sendStatus(400).json({error: "Bad request"})
    }


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