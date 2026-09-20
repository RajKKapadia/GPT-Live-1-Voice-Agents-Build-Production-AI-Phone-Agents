import WebSocket from "ws"

import { executeTool } from "../tools/execute-tool"
import type { RuntimeContext } from "../runtime/action-runtime";
import type { Run } from "openai/resources/beta/threads.js";

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

            ws.on("message", async (raw) => {
                try {
                    const event = JSON.parse(
                        raw.toString()
                    )

                    await handleSidebandEvent(
                        ws,
                        event,
                        runtimeContext
                    )
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
    event: any,
    runtimeContext: RuntimeContext
) {
    console.log(
        "Sideband event:",
        event.type
    )

    if (event.type === "error") {
        console.error("Sideband API error:", event.error)
        return
    }

    if (event.type !== "response.event") {
        return
    }

    const responseEvent = event.event

    if (responseEvent.type === "response.failed") {
        console.error("Delegated response failed:", responseEvent.response?.error)
        return
    }

    if (
        responseEvent.type !==
        "response.output_item.done"
    ) {
        return
    }

    const item = responseEvent.item

    if (item.type !== "function_call") {
        return
    }

    console.log(
        "Function call:",
        item.name
    )

    console.log(
        "Arguments:",
        item.arguments
    )

    const args = item.arguments
        ? JSON.parse(item.arguments)
        : {}

    const result = await executeTool(
        item.name,
        args,
        runtimeContext
    );

    console.log(
        "Tool result:",
        result
    )

    sendToolResult(
        ws,
        item.call_id,
        result
    )
}

function sendToolResult(
    ws: WebSocket,
    callId: string,
    result: unknown
) {
    ws.send(
        JSON.stringify({
            type: "response.item.create",

            event_id:
                `tool_${crypto.randomUUID()}`,

            item: {
                type: "function_call_output",

                call_id: callId,

                output: JSON.stringify(result),
            },
        })
    )

    ws.send(
        JSON.stringify({
            type: "response.create",

            event_id:
                `continue_${crypto.randomUUID()}`,
        })
    )
}
