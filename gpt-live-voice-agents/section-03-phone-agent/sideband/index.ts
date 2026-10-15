import { LiveWS } from "openai/resources/live/ws"
import { executeTool } from "../tools/execute-tool"
import type { OpenAI } from "openai"
import type { RuntimeContext } from "../runtime/action-runtime"


export async function handleSidebandEvent(
    liveWs: LiveWS,
    responseEvent: OpenAI.Live.ResponseEvent,
    runtimeContext: RuntimeContext
) {

    if (responseEvent.type === "response.event") {
        const event = responseEvent.event

        if (event.type === "response.output_item.done") {

            const item = event.item as OpenAI.Responses.ResponseOutputItem

            if (item.type === "function_call") {

                if (item.status === "completed") {

                    const toolResult = await executeTool(item, runtimeContext)

                    sendToolResult(liveWs, responseEvent.event_id, item.call_id, JSON.stringify(toolResult))
                }
            }
        }
    }
}

function sendToolResult(
    liveWs: LiveWS,
    eventId: string,
    callId: string,
    result: string,
) {
    liveWs.send({
        type: "response.item.create",
        item: {
            type: "function_call_output",
            call_id: callId,
            output: result,
            status: "completed"
        },
        event_id: eventId
    })

    liveWs.send({ type: "response.create", event_id: eventId })
}
