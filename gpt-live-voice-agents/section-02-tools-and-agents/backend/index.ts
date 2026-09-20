import OpenAI from "openai"

import { store, findOrderById } from "./src/data/store"
import {
    getOrderTool,
} from "./src/tools/get-order";

import {
    getShipmentTool,
} from "./src/tools/get-shipment";

import {
    searchProductsTool,
} from "./src/tools/search-products";

import {
    getReturnStatusTool,
} from "./src/tools/get-return-status";

import {
    requestReturnTool,
} from "./src/tools/request-return";

import {
    changeOrderAddressTool,
} from "./src/tools/change-order-address";
import {
    connectSideband,
} from "./src/live/sideband"

import {
    confirmActionTool,
} from "./src/tools/confirm-action";

import {
    delegateToSpecialistTool,
} from "./src/tools/delegate-to-specialist";

import {
    escalateToHumanTool,
} from "./src/tools/escalate-to-human";

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

        if (request.method === "GET" && url.pathname === "/api/debug/orders") {
            console.log("I am gere")
            return Response.json(store.orders)
        }

        if (request.method === "GET" && url.pathname.startsWith("/api/debug/orders/")) {
            const orderId = url.pathname.split("/").at(-1)

            console.log(orderId)

            if (!orderId) {
                return Response.json({ error: "Order ID is required" }, { status: 404 })
            }

            const order = findOrderById(orderId)

            if (!order) {
                return Response.json({ error: "Order not found" }, { status: 404 })
            }

            return Response.json(order, { status: 200 })
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
                        instructions: `You are the voice customer support agent for Orbit Supply.

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
                        - only after confirmation should the action continue`,
                        audio: {
                            output: {
                                voice: "marin"
                            }
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
                                parallel_tool_calls: false
                            }
                        }
                    },
                    transport: {
                        type: "webrtc",
                        sdp: body.sdp,
                    },
                })

                await connectSideband(result.session.id, { customerId: "CUS-1001", sessionId: result.session.id })

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
