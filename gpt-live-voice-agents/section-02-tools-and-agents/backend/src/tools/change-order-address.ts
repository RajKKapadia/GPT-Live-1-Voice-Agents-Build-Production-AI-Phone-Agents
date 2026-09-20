import type {
    Address,
} from "../data/types";

import {
    findOrderById,
    findShipmentByOrderId,
} from "../data/store";

export const changeOrderAddressTool = {
    type: "function" as const,

    name: "change_order_address",

    description:
        "Change the shipping address of an Orbit Supply order if the order has not shipped yet.",

    parameters: {
        type: "object",

        properties: {
            orderId: {
                type: "string",
                description:
                    "The Orbit Supply order ID.",
            },

            address: {
                type: "object",

                properties: {
                    line1: {
                        type: "string",
                    },

                    line2: {
                        type: "string",
                    },

                    city: {
                        type: "string",
                    },

                    state: {
                        type: "string",
                    },

                    postalCode: {
                        type: "string",
                    },

                    country: {
                        type: "string",
                    },
                },

                required: [
                    "line1",
                    "city",
                    "state",
                    "postalCode",
                    "country",
                ],

                additionalProperties: false,
            },
        },

        required: [
            "orderId",
            "address",
        ],

        additionalProperties: false,
    },

    strict: true,
};

export function changeOrderAddress(
    orderId: string,
    address: Address
) {
    const order = findOrderById(orderId);

    if (!order) {
        return {
            success: false,
            error: "Order not found",
        };
    }

    if (
        order.status !== "processing"
    ) {
        return {
            success: false,

            error:
                "The shipping address can only be changed while the order is still processing.",

            currentStatus:
                order.status,
        };
    }

    const shipment =
        findShipmentByOrderId(orderId);

    if (
        shipment &&
        !shipment.addressChangeAllowed
    ) {
        return {
            success: false,

            error:
                "The carrier no longer allows address changes for this shipment.",
        };
    }

    const previousAddress = {
        ...order.shippingAddress,
    };

    order.shippingAddress = {
        ...address,
    };

    return {
        success: true,

        message:
            "Shipping address updated successfully.",

        orderId,

        previousAddress,

        newAddress:
            order.shippingAddress,
    };
}