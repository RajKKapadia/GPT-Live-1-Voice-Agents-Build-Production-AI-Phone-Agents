import WebSocket from "ws"

import { executeTool } from "../tools/execute-tool"
import type { RuntimeContext } from "../runtime/action-runtime";
import type { OpenAI } from "openai";

const connections = new Map<
    string,
    WebSocket
>()

export function connectSideband(
    sessionId: string,
    runtimeContext: RuntimeContext
) {
    return new Promise<WebSocket>(
        (resolve, reject) => {
            const url =
                `wss://api.openai.com/v1/live/sessions/${sessionId}/attach`

            const ws = new WebSocket(url, {
                headers: {
                    Authorization:
                        `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            })

            ws.on("open", () => {
                console.log(
                    `Sideband connected: ${sessionId}`
                )

                connections.set(sessionId, ws)

                resolve(ws)
            })

            ws.on("error", (error) => {
                console.error(
                    "Sideband error:",
                    error
                )

                reject(error)
            })

            ws.on("close", () => {
                console.log(
                    `Sideband closed: ${sessionId}`
                )

                connections.delete(sessionId)
            })

            ws.on("message", async (rawEvent) => {
                try {
                    const responseEvent = JSON.parse(rawEvent.toString()) as OpenAI.Live.ResponseEvent
                    await handleSidebandEvent(ws, responseEvent, runtimeContext)
                } catch (error) {
                    console.error(
                        "Sideband message error:",
                        error
                    )
                }
            })
        }
    )
}

async function handleSidebandEvent(
    ws: WebSocket,
    responseEvent: OpenAI.Live.ResponseEvent,
    runtimeContext: RuntimeContext
) {
    if (responseEvent.type === "response.event") {
        const event = responseEvent.event

        if (event.type === "response.output_item.done") {

            const item = event.item as OpenAI.Responses.ResponseOutputItem

            if (item.type === "function_call") {

                if (item.status === "completed") {

                    /**
                     * TODOs
                     * Call the actual tool
                     * Submit the response
                     */
                    const toolResult = await executeTool(item, runtimeContext)

                    sendToolResult(ws, responseEvent.event_id, item.call_id, JSON.stringify(toolResult))
                }
            }
        }
    }
}

function sendToolResult(
    ws: WebSocket,
    callId: string,
    eventId: string,
    output: string
) {
    ws.send(
        JSON.stringify({
            type: "response.item.create",

            event_id: eventId,

            item: {
                type: "function_call_output",

                call_id: callId,

                output: output,
            },
        })
    )

    ws.send(
        JSON.stringify({
            type: "response.create",

            event_id: eventId,
        })
    )
}
