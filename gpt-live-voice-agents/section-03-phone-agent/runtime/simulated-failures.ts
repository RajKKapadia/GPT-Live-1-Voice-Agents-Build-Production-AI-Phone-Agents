import { ToolError } from "./action-runtime";

export function simulateOrderFailure(
    orderId: string
) {
    switch (orderId) {
        case "ORD-404":
            throw new ToolError(
                "ORDER_NOT_FOUND",
                "I couldn't find an order with that ID.",
                false
            );

        case "ORD-TIMEOUT":
            throw new ToolError(
                "BACKEND_TIMEOUT",
                "The order system took too long to respond.",
                true
            );

        case "ORD-DOWN":
            throw new ToolError(
                "BACKEND_UNAVAILABLE",
                "The order system is temporarily unavailable.",
                true
            );

        case "ORD-LOCKED":
            throw new ToolError(
                "PERMISSION_DENIED",
                "This order requires assistance from a human support agent.",
                false,
                true
            );
    }
}

export function simulatePaymentFailure(
    orderId: string
) {
    if (orderId === "ORD-PAYFAIL") {
        throw new ToolError(
            "PAYMENT_SYSTEM_FAILURE",
            "The refund couldn't be processed by the payment system.",
            true
        );
    }
}