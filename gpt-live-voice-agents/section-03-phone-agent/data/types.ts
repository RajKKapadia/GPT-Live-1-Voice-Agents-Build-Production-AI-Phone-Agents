export type Address = {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
}

export type Customer = {
    id: string
    name: string
    email: string
    phone: string
    tier: "standard" | "plus" | "premium"
    defaultAddress: Address
}

export type Product = {
    id: string
    name: string
    category: string
    price: number
    stock: number
}

export type OrderItem = {
    productId: string
    quantity: number
    unitPrice: number
}

export type OrderStatus =
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"

export type Order = {
    id: string
    customerId: string
    status: OrderStatus
    items: OrderItem[]
    total: number
    shippingAddress: Address
    placedAt: string
    deliveredAt?: string
    shipmentId?: string
}

export type ShipmentStatus =
    | "label_created"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "delayed"

export type Shipment = {
    id: string
    orderId: string
    carrier: string
    trackingNumber: string
    status: ShipmentStatus
    estimatedDelivery: string
    latestUpdate: string
    addressChangeAllowed: boolean
}

export type ReturnStatus =
    | "requested"
    | "approved"
    | "rejected"
    | "refunded"

export type ReturnRequest = {
    id: string
    orderId: string
    customerId: string
    status: ReturnStatus
    reason: string
    requestedAt: string
    refundAmount: number
}

export type FAQ = {
    id: string
    question: string
    answer: string
    keywords: string[]
}