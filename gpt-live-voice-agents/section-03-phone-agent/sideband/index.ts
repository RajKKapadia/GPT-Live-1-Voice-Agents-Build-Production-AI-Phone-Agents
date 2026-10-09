import { LiveWS } from "openai/resources/live/ws"
import { executeTool } from "../tools/execute-tool"

export type RuntimeContext = {
    customerId: string
}

export type EventData = {

}

export async function handleSidebandEvent(
    live: LiveWS,
    data: {
        functionName: string
        functionArgs: string
        callId: string
        eventId: string
    },
    runtimeContext: RuntimeContext
) {

    const result = await executeTool(data.functionName, data.functionArgs)

    console.log(
        "Tool result:",
        JSON.stringify(result)
    )

    sendToolResult(
        live,
        data.callId,
        JSON.stringify(result),
        data.eventId
    )
}

function sendToolResult(
    live: LiveWS,
    callId: string,
    result: string,
    eventId: string
) {
    live.send({
        type: "response.item.create",
        item: {
            type: "function_call_output",
            call_id: callId,
            output: result,
            status: "completed"
        },
        event_id: eventId
    })

    live.send({ type: "response.create" })
}
