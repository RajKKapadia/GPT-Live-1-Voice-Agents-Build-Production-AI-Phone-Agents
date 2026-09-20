import type {
    Customer,
    Product,
    Order,
    Shipment,
    FAQ,
    ReturnRequest,
} from "./types"

function daysAgo(days: number) {
    const date = new Date()

    date.setDate(date.getDate() - days)

    return date.toISOString()
}

function daysFromNow(days: number) {
    const date = new Date()

    date.setDate(date.getDate() + days)

    return date.toISOString()
}

export const customers: Customer[] = [
    {
        id: "CUS-1001",
        name: "Aarav Sharma",
        email: "aarav.sharma@example.com",
        phone: "+1-202-555-0101",
        tier: "premium",
        defaultAddress: {
            line1: "125 Market Street",
            city: "Austin",
            state: "TX",
            postalCode: "78701",
            country: "US",
        },
    },

    {
        id: "CUS-1002",
        name: "Emma Wilson",
        email: "emma.wilson@example.com",
        phone: "+1-202-555-0102",
        tier: "standard",
        defaultAddress: {
            line1: "82 Oak Avenue",
            city: "Seattle",
            state: "WA",
            postalCode: "98101",
            country: "US",
        },
    },

    {
        id: "CUS-1003",
        name: "Daniel Carter",
        email: "daniel.carter@example.com",
        phone: "+1-202-555-0103",
        tier: "plus",
        defaultAddress: {
            line1: "410 Pine Road",
            city: "Denver",
            state: "CO",
            postalCode: "80202",
            country: "US",
        },
    },
]

export const products: Product[] = [
    {
        id: "PROD-1001",
        name: "Orbit Wireless Headphones",
        category: "Audio",
        price: 149.99,
        stock: 34,
    },

    {
        id: "PROD-1002",
        name: "Orbit Smart Speaker",
        category: "Smart Home",
        price: 89.99,
        stock: 18,
    },

    {
        id: "PROD-1003",
        name: "Orbit Mechanical Keyboard",
        category: "Computer Accessories",
        price: 119.99,
        stock: 12,
    },

    {
        id: "PROD-1004",
        name: "Orbit 4K Webcam",
        category: "Computer Accessories",
        price: 179.99,
        stock: 7,
    },

    {
        id: "PROD-1005",
        name: "Orbit USB-C Hub",
        category: "Computer Accessories",
        price: 69.99,
        stock: 0,
    },
]

export const orders: Order[] = [
    {
        id: "ORD-1001",
        customerId: "CUS-1001",
        status: "processing",
        items: [
            {
                productId: "PROD-1003",
                quantity: 1,
                unitPrice: 119.99,
            },
        ],
        total: 119.99,
        placedAt: "2026-09-18T10:30:00Z",
        shippingAddress: {
            line1: "125 Market Street",
            city: "Austin",
            state: "TX",
            postalCode: "78701",
            country: "US",
        },
    },

    {
        id: "ORD-1002",
        customerId: "CUS-1001",
        status: "shipped",
        items: [
            {
                productId: "PROD-1001",
                quantity: 1,
                unitPrice: 149.99,
            },
        ],
        total: 149.99,
        placedAt: "2026-09-15T08:15:00Z",
        shipmentId: "SHIP-1002",
        shippingAddress: {
            line1: "125 Market Street",
            city: "Austin",
            state: "TX",
            postalCode: "78701",
            country: "US",
        },
    },

    {
        id: "ORD-1003",
        customerId: "CUS-1002",
        status: "delivered",
        items: [
            {
                productId: "PROD-1002",
                quantity: 1,
                unitPrice: 89.99,
            },
        ],
        total: 89.99,
        placedAt: "2026-09-05T14:10:00Z",
        deliveredAt: "2026-09-09T16:30:00Z",
        shipmentId: "SHIP-1003",
        shippingAddress: {
            line1: "82 Oak Avenue",
            city: "Seattle",
            state: "WA",
            postalCode: "98101",
            country: "US",
        },
    },

    {
        id: "ORD-1004",
        customerId: "CUS-1002",
        status: "delivered",
        items: [
            {
                productId: "PROD-1004",
                quantity: 1,
                unitPrice: 179.99,
            },
        ],
        total: 179.99,
        placedAt: "2026-07-18T11:20:00Z",
        deliveredAt: "2026-07-23T13:00:00Z",
        shipmentId: "SHIP-1004",
        shippingAddress: {
            line1: "82 Oak Avenue",
            city: "Seattle",
            state: "WA",
            postalCode: "98101",
            country: "US",
        },
    },

    {
        id: "ORD-1005",
        customerId: "CUS-1003",
        status: "shipped",
        items: [
            {
                productId: "PROD-1001",
                quantity: 2,
                unitPrice: 149.99,
            },
        ],
        total: 299.98,
        placedAt: "2026-09-12T09:45:00Z",
        shipmentId: "SHIP-1005",
        shippingAddress: {
            line1: "410 Pine Road",
            city: "Denver",
            state: "CO",
            postalCode: "80202",
            country: "US",
        },
    },
]

export const shipments: Shipment[] = [
    {
        id: "SHIP-1002",
        orderId: "ORD-1002",
        carrier: "FedEx",
        trackingNumber: "FDX928374610",
        status: "in_transit",
        estimatedDelivery: "2026-09-21",
        latestUpdate:
            "Package departed the Dallas distribution center.",
        addressChangeAllowed: false,
    },

    {
        id: "SHIP-1003",
        orderId: "ORD-1003",
        carrier: "UPS",
        trackingNumber: "UPS748392001",
        status: "delivered",
        estimatedDelivery: "2026-09-09",
        latestUpdate:
            "Package delivered at the customer's front door.",
        addressChangeAllowed: false,
    },

    {
        id: "SHIP-1004",
        orderId: "ORD-1004",
        carrier: "UPS",
        trackingNumber: "UPS292837461",
        status: "delivered",
        estimatedDelivery: "2026-07-23",
        latestUpdate:
            "Package delivered successfully.",
        addressChangeAllowed: false,
    },

    {
        id: "SHIP-1005",
        orderId: "ORD-1005",
        carrier: "FedEx",
        trackingNumber: "FDX564738291",
        status: "delayed",
        estimatedDelivery: "2026-09-23",
        latestUpdate:
            "Shipment delayed because of severe weather near the regional hub.",
        addressChangeAllowed: false,
    },
]

export const returns: ReturnRequest[] = [
    {
        id: "RET-1001",
        orderId: "ORD-1003",
        customerId: "CUS-1002",
        status: "requested",
        reason: "The smart speaker does not fit my setup.",
        requestedAt: "2026-09-18T12:00:00Z",
        refundAmount: 89.99,
    },
]

export const faqs: FAQ[] = [
    {
        id: "FAQ-1001",
        question: "What is the return policy?",
        answer:
            "Most Orbit Supply products can be returned within 30 days of delivery, provided they are in good condition.",
        keywords: ["return", "refund", "30 days", "return policy"],
    },

    {
        id: "FAQ-1002",
        question: "How long does standard shipping take?",
        answer:
            "Standard shipping normally takes 3 to 5 business days.",
        keywords: ["shipping", "delivery", "standard shipping"],
    },

    {
        id: "FAQ-1003",
        question: "Can I change my delivery address?",
        answer:
            "A delivery address can normally be changed while an order is still processing. Once the shipment has been handed to the carrier, address changes may no longer be possible.",
        keywords: ["address", "delivery address", "change address"],
    },

    {
        id: "FAQ-1004",
        question: "When will I receive my refund?",
        answer:
            "Approved refunds normally appear on the original payment method within 5 to 7 business days.",
        keywords: ["refund", "payment", "refund time"],
    },

    {
        id: "FAQ-1005",
        question: "Do Orbit products include a warranty?",
        answer:
            "Orbit branded electronics include a one-year limited warranty covering manufacturing defects.",
        keywords: ["warranty", "defect", "repair"],
    },
]

export const store = {
    customers,
    products,
    orders,
    shipments,
    faqs,
    returns,
}

export function findCustomerById(customerId: string) {
    return customers.find(
        (customer) => customer.id === customerId
    )
}

export function findOrderById(orderId: string) {
    return orders.find(
        (order) => order.id === orderId
    )
}

export function findShipmentByOrderId(
    orderId: string
) {
    return shipments.find(
        (shipment) => shipment.orderId === orderId
    )
}

export function findReturnByOrderId(
    orderId: string
) {
    return returns.find(
        (returnRequest) =>
            returnRequest.orderId === orderId
    )
}