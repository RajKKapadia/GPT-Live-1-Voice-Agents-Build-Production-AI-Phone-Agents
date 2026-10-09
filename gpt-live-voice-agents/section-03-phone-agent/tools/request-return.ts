import {
    findOrderById,
    findReturnByOrderId,
    returns,
} from "../data/store";

export const requestReturnTool = {
    type: "function" as const,

    name: "request_return",

    description:
        "Create a return request for an eligible delivered Orbit Supply order.",

    parameters: {
        type: "object",

        properties: {
            orderId: {
                type: "string",
                description:
                    "The Orbit Supply order ID.",
            },

            reason: {
                type: "string",
                description:
                    "The customer's reason for returning the order.",
            },
        },

        required: [
            "orderId",
            "reason",
        ],

        additionalProperties: false,
    },

    strict: true,
};

export function requestReturn(
    orderId: string,
    reason: string
) {
    const order = findOrderById(orderId);

    if (!order) {
        return {
            success: false,
            error: "Order not found",
        };
    }

    if (
        order.status !== "delivered"
    ) {
        return {
            success: false,
            error:
                "Only delivered orders can be returned.",
        };
    }

    const existingReturn =
        findReturnByOrderId(orderId);

    if (existingReturn) {
        return {
            success: false,
            error:
                "A return request already exists for this order.",

            returnId:
                existingReturn.id,

            status:
                existingReturn.status,
        };
    }

    if (!order.deliveredAt) {
        return {
            success: false,
            error:
                "Delivery date is unavailable.",
        };
    }

    const deliveredAt =
        new Date(order.deliveredAt);

    const now = new Date();

    const millisecondsPerDay =
        1000 * 60 * 60 * 24;

    const daysSinceDelivery =
        Math.floor(
            (now.getTime() -
                deliveredAt.getTime()) /
            millisecondsPerDay
        );

    if (daysSinceDelivery > 30) {
        return {
            success: false,

            error:
                "The 30-day return window has expired.",

            daysSinceDelivery,
        };
    }

    const returnRequest = {
        id: `RET-${crypto.randomUUID()}`,

        orderId:
            order.id,

        customerId:
            order.customerId,

        status:
            "requested" as const,

        reason,

        requestedAt:
            new Date().toISOString(),

        refundAmount:
            order.total,
    };

    returns.push(returnRequest);

    return {
        success: true,

        message:
            "Return request created successfully.",

        return: returnRequest,
    };
}