import {
    findOrderById,
    findShipmentByOrderId,
    products,
} from "../data/store"

export const getOrderTool = {
    type: "function" as const,
    name: "get_order",

    description:
        "Get information about an Orbit Supply order using its order ID.",

    parameters: {
        type: "object",

        properties: {
            orderId: {
                type: "string",
                description:
                    "The Orbit Supply order ID, for example ORD-1001",
            },
        },

        required: ["orderId"],
        additionalProperties: false,
    },

    strict: true,
}

export function getOrder(orderId: string) {
    const order = findOrderById(orderId)

    if (!order) {
        return {
            found: false,
            orderId,
            error: "Order not found",
        }
    }

    const items = order.items.map((item) => {
        const product = products.find(
            (product) =>
                product.id === item.productId
        )

        return {
            productId: item.productId,
            productName: product?.name ?? "Unknown product",
            quantity: item.quantity,
            unitPrice: item.unitPrice,
        }
    })

    const shipment = findShipmentByOrderId(
        order.id
    )

    return {
        found: true,

        order: {
            id: order.id,
            customerId: order.customerId,
            status: order.status,
            total: order.total,
            placedAt: order.placedAt,
            deliveredAt: order.deliveredAt,

            items,

            shipment: shipment
                ? {
                    carrier: shipment.carrier,
                    trackingNumber:
                        shipment.trackingNumber,
                    status: shipment.status,
                    estimatedDelivery:
                        shipment.estimatedDelivery,
                    latestUpdate:
                        shipment.latestUpdate,
                }
                : null,
        },
    }
}