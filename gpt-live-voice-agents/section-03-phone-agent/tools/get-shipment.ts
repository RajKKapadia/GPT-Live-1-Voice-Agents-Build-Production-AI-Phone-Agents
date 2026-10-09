import {
    findOrderById,
    findShipmentByOrderId,
} from "../data/store";

export const getShipmentTool = {
    type: "function" as const,

    name: "get_shipment",

    description:
        "Get shipment and tracking information for an Orbit Supply order.",

    parameters: {
        type: "object",

        properties: {
            orderId: {
                type: "string",
                description:
                    "The Orbit Supply order ID, for example ORD-1005",
            },
        },

        required: ["orderId"],
        additionalProperties: false,
    },

    strict: true,
};

export function getShipment(orderId: string) {
    const order = findOrderById(orderId);

    if (!order) {
        return {
            found: false,
            error: "Order not found",
            orderId,
        };
    }

    const shipment =
        findShipmentByOrderId(orderId);

    if (!shipment) {
        return {
            found: false,
            orderId,
            message:
                "No shipment exists for this order yet.",
        };
    }

    return {
        found: true,

        shipment: {
            orderId,
            carrier: shipment.carrier,
            trackingNumber:
                shipment.trackingNumber,
            status: shipment.status,
            estimatedDelivery:
                shipment.estimatedDelivery,
            latestUpdate:
                shipment.latestUpdate,
            addressChangeAllowed:
                shipment.addressChangeAllowed,
        },
    };
}