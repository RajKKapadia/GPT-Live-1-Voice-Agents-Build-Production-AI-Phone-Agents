import {
    findOrderById,
    findReturnByOrderId,
} from "../data/store";

export const getReturnStatusTool = {
    type: "function" as const,

    name: "get_return_status",

    description:
        "Check whether a return request exists for an Orbit Supply order and get its current status.",

    parameters: {
        type: "object",

        properties: {
            orderId: {
                type: "string",
                description:
                    "The Orbit Supply order ID.",
            },
        },

        required: ["orderId"],
        additionalProperties: false,
    },

    strict: true,
};

export function getReturnStatus(
    orderId: string
) {
    const order = findOrderById(orderId);

    if (!order) {
        return {
            found: false,
            error: "Order not found",
        };
    }

    const returnRequest =
        findReturnByOrderId(orderId);

    if (!returnRequest) {
        return {
            found: false,
            orderId,
            message:
                "No return request exists for this order.",
        };
    }

    return {
        found: true,

        return: {
            id: returnRequest.id,
            orderId:
                returnRequest.orderId,
            status:
                returnRequest.status,
            reason:
                returnRequest.reason,
            requestedAt:
                returnRequest.requestedAt,
            refundAmount:
                returnRequest.refundAmount,
        },
    };
}