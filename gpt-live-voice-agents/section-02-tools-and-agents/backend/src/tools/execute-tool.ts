import { getOrder } from "./get-order";
import { getShipment } from "./get-shipment";
import { searchProducts } from "./search-products";
import { getReturnStatus } from "./get-return-status";
import { requestReturn } from "./request-return";
import { changeOrderAddress } from "./change-order-address";

import {
    ToolError,
    type RuntimeContext,
    type ToolResult,
    createPendingAction,
    consumePendingAction,
    recordFailure,
    clearFailures,
    logAction,
} from "../runtime/action-runtime";
import { runSpecialist } from "../agents/specialists";
import { createEscalation } from "./escalate-to-human";
import type { Address } from "../data/types";
import type { OpenAI } from "openai";

const SENSITIVE_TOOLS = new Set([
    "request_return",
    "change_order_address",
    "cancel_order",
    "request_refund",
]);

function describeSensitiveAction(
    name: string,
    args: Record<string, unknown>
) {
    switch (name) {
        case "request_return":
            return `Submit a return request for order ${args.orderId}`;

        case "change_order_address":
            return `Change the delivery address for order ${args.orderId}`;

        case "cancel_order":
            return `Cancel order ${args.orderId}`;

        case "request_refund":
            return `Submit a refund request for order ${args.orderId}`;

        default:
            return `Perform ${name}`;
    }
}


async function executeRawTool(
    name: string,
    args: Record<string, unknown>,
    context: RuntimeContext
): Promise<ToolResult> {
    try {
        let result: unknown;

        console.log("========== TOOL EXECUTION ==========");
        console.log("Tool:", name);
        console.log("Args:", args);
        console.log(
            "Args JSON:",
            JSON.stringify(args, null, 2)
        );


        switch (name) {
            case "get_order":
                result = getOrder(
                    args.orderId as string
                );
                break;

            case "get_shipment":
                result = getShipment(
                    args.orderId as string
                );
                break;

            case "search_products":
                result = searchProducts(
                    args.query as string,
                    (args.inStockOnly as boolean | undefined) ??
                    false
                );
                break;

            case "get_return_status":
                result = getReturnStatus(
                    args.orderId as string
                );
                break;

            case "request_return":
                result = requestReturn(
                    args.orderId as string,
                    args.reason as string
                );
                break;

            case "change_order_address":
                result = changeOrderAddress(
                    args.orderId as string,
                    args.address as Address
                );
                break;

            default:
                throw new ToolError(
                    "UNKNOWN_TOOL",
                    "That operation isn't available.",
                    false
                );
        }

        clearFailures(context.sessionId, name);

        logAction(context.sessionId, {
            toolName: name,
            status: "success",
        });

        return {
            status: "success",
            data: result,
        };
    } catch (error) {
        console.error(
            `[tool:${name}]`,
            error
        );

        const toolError =
            error instanceof ToolError
                ? error
                : new ToolError(
                    "INTERNAL_TOOL_ERROR",
                    "Something went wrong while completing that request.",
                    true
                );

        const failureCount = recordFailure(
            context.sessionId,
            name
        );

        logAction(context.sessionId, {
            toolName: name,
            status: "failed",
            details: toolError.code,
        });

        return {
            status: "error",
            error: {
                code: toolError.code,
                message: toolError.userMessage,
                retryable: toolError.retryable,
            },
            failureCount,
            escalationRecommended:
                toolError.forceEscalation ||
                failureCount >= 2,
        };
    }
}


// export async function executeTool(
//     name: string,
//     args: Record<string, unknown>
// ) {
//     console.log(
//         `Executing tool: ${name}`
//     );

//     console.log(
//         "Arguments:",
//         args
//     );

//     switch (name) {
//         // ------------------------------------------
//         // GET ORDER
//         // ------------------------------------------

//         case "get_order": {
//             const orderId =
//                 args.orderId;

//             if (
//                 typeof orderId !== "string"
//             ) {
//                 return {
//                     error:
//                         "orderId is required",
//                 };
//             }

//             return getOrder(orderId);
//         }

//         // ------------------------------------------
//         // GET SHIPMENT
//         // ------------------------------------------

//         case "get_shipment": {
//             const orderId =
//                 args.orderId;

//             if (
//                 typeof orderId !== "string"
//             ) {
//                 return {
//                     error:
//                         "orderId is required",
//                 };
//             }

//             return getShipment(orderId);
//         }

//         // ------------------------------------------
//         // SEARCH PRODUCTS
//         // ------------------------------------------

//         case "search_products": {
//             const query =
//                 args.query;

//             const inStockOnly =
//                 args.inStockOnly;

//             if (
//                 typeof query !== "string"
//             ) {
//                 return {
//                     error:
//                         "query is required",
//                 };
//             }

//             return searchProducts(
//                 query,
//                 typeof inStockOnly ===
//                     "boolean"
//                     ? inStockOnly
//                     : false
//             );
//         }

//         // ------------------------------------------
//         // GET RETURN STATUS
//         // ------------------------------------------

//         case "get_return_status": {
//             const orderId =
//                 args.orderId;

//             if (
//                 typeof orderId !== "string"
//             ) {
//                 return {
//                     error:
//                         "orderId is required",
//                 };
//             }

//             return getReturnStatus(
//                 orderId
//             );
//         }

//         // ------------------------------------------
//         // REQUEST RETURN
//         // ------------------------------------------

//         case "request_return": {
//             const orderId =
//                 args.orderId;

//             const reason =
//                 args.reason;

//             if (
//                 typeof orderId !== "string" ||
//                 typeof reason !== "string"
//             ) {
//                 return {
//                     error:
//                         "orderId and reason are required",
//                 };
//             }

//             return requestReturn(
//                 orderId,
//                 reason
//             );
//         }

//         // ------------------------------------------
//         // CHANGE ADDRESS
//         // ------------------------------------------

//         case "change_order_address": {
//             const orderId =
//                 args.orderId;

//             const address =
//                 args.address;

//             if (
//                 typeof orderId !==
//                 "string" ||
//                 typeof address !==
//                 "object" ||
//                 address === null
//             ) {
//                 return {
//                     error:
//                         "orderId and address are required",
//                 };
//             }

//             return changeOrderAddress(
//                 orderId,
//                 address as Address
//             );
//         }

//         // ------------------------------------------
//         // UNKNOWN
//         // ------------------------------------------

//         default:
//             return {
//                 error:
//                     `Unknown tool: ${name}`,
//             };
//     }
// }

export async function executeTool(
    item: OpenAI.Responses.ResponseFunctionToolCall,
    runContext: RuntimeContext
): Promise<ToolResult> {
    const name = item.name
    if (name === "confirm_action") {
        const args = JSON.parse(item.arguments) as { confirmationId: string }

        try {
            const pending = consumePendingAction(
                args.confirmationId,
                runContext.sessionId
            );

            return await executeRawTool(
                pending.toolName,
                pending.args,
                runContext
            );
        } catch (error) {
            const toolError =
                error instanceof ToolError
                    ? error
                    : new ToolError(
                        "CONFIRMATION_FAILED",
                        "I couldn't confirm that action."
                    );

            return {
                status: "error",
                error: {
                    code: toolError.code,
                    message: toolError.userMessage,
                    retryable: toolError.retryable,
                },
                failureCount: 1,
                escalationRecommended: false,
            };
        }
    }

    if (name === "delegate_to_specialist") {
        const args = JSON.parse(item.arguments) as { specialist: "order" | "refund" | "product", task: string, context: string }
        const result = await runSpecialist(args);

        logAction(runContext.sessionId, {
            toolName: `specialist:${args.specialist}`,
            status: "delegated",
        });

        return {
            status: "success",
            data: result,
        };
    }

    if (name === "escalate_to_human") {
        const args = JSON.parse(item.arguments) as { reason: string, conversationSummary: string, problemDescription: string }
        const escalation =
            await createEscalation({
                runContext,

                reason: args.reason,

                conversationSummary: args.conversationSummary,

                problemDescription: args.problemDescription
            });

        logAction(runContext.sessionId, {
            toolName: "human_escalation",
            status: "escalated",
            details: escalation.caseId,
        });

        return {
            status: "success",
            data: {
                caseId: escalation.caseId,
                message:
                    "The issue has been escalated to a human support agent.",
            },
        };
    }

    if (SENSITIVE_TOOLS.has(name)) {
        const args = JSON.parse(item.arguments)
        const description = describeSensitiveAction(name, args);

        const confirmationId = createPendingAction(
            runContext.sessionId,
            name,
            args,
            description
        );

        logAction(runContext.sessionId, {
            toolName: name,
            status: "confirmation_required",
            details: description,
        });

        return {
            status: "confirmation_required",
            confirmationId,
            message: description,
        };
    }

    const args = JSON.parse(item.arguments)

    return executeRawTool(
        name,
        args,
        runContext
    );
}