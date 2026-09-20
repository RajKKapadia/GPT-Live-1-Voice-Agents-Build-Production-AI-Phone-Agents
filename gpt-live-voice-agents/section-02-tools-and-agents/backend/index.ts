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
                        instructions: `You are the backend customer support agent for Orbit Supply.

                        You have access to verified Orbit Supply business data through tools.

                        Use:

                        get_order
                        - for general order information

                        get_shipment
                        - for tracking, carrier, delivery date, shipment delay, or shipment status

                        search_products
                        - for product availability, inventory, pricing, or product search

                        get_return_status
                        - when a customer asks about an existing return

                        request_return
                        - when a customer wants to create a return

                        change_order_address
                        - when a customer asks to change the shipping address of an order

                        Never invent:
                        - order information
                        - shipment information
                        - inventory
                        - delivery dates
                        - tracking numbers
                        - return status
                        - customer information

                        Always use tools when the answer depends on Orbit Supply business data.

                        Respect any failure or business-rule result returned by a tool.`,
                        audio: {
                            output: {
                                voice: "marin"
                            }
                        },
                        delegation: {
                            type: "responses",
                            responses: {
                                model: "gpt-5.6-luna",
                                instructions: `
                                You are the backend customer support agent
                                for Orbit Supply.

                                Use the available tools whenever the answer
                                depends on business data.

                                For questions about an order, use get_order.

                                Never invent:
                                - order status
                                - shipment status
                                - delivery dates
                                - tracking numbers
                                - customer information

                                Return verified facts from the tools.`,
                                tools: [getOrderTool,
                                    getShipmentTool,
                                    searchProductsTool,
                                    getReturnStatusTool,
                                    requestReturnTool,
                                    changeOrderAddressTool,],
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

                await connectSideband(result.session.id)

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