import type { Address } from "../data/types";
import { changeOrderAddress } from "./change-order-address";
import { getOrder } from "./get-order"
import { getReturnStatus } from "./get-return-status";
import { getShipment } from "./get-shipment";
import { requestReturn } from "./request-return";
import { searchProducts } from "./search-products";

type GetOrderRequest = {
    orderId: string
}

type SearchProductRequest = {
    query: string
    inStockOnly: boolean
}

type ReturnOrderRequest = {
    reason: string
    orderId: string
}

type ChangeOrderAddressRequest = {
    orderId: string
    address: Address
}

export async function executeTool(
    name: string,
    args: string
) {

    console.log("Executing tool")
    console.log(`Executing tool: ${name}`)

    console.log("Arguments:", args)

    switch (name) {
        // ------------------------------------------
        // GET ORDER
        // ------------------------------------------

        case "get_order": {
            const data = JSON.parse(args) as GetOrderRequest

            return getOrder(data.orderId)
        }

        // ------------------------------------------
        // GET SHIPMENT
        // ------------------------------------------

        case "get_shipment": {
            const data = JSON.parse(args) as GetOrderRequest

            return getShipment(data.orderId)
        }

        // // ------------------------------------------
        // // SEARCH PRODUCTS
        // // ------------------------------------------

        case "search_products": {
            const data = JSON.parse(args) as SearchProductRequest

            return searchProducts(
                data.query,
                data.inStockOnly
            )
        }

        // // ------------------------------------------
        // // GET RETURN STATUS
        // // ------------------------------------------

        case "get_return_status": {
            const data = JSON.parse(args) as GetOrderRequest

            return getReturnStatus(
                data.orderId
            )
        }

        // // ------------------------------------------
        // // REQUEST RETURN
        // // ------------------------------------------

        case "request_return": {
            const data = JSON.parse(args) as ReturnOrderRequest

            return requestReturn(
                data.orderId,
                data.reason
            )
        }

        // // ------------------------------------------
        // // CHANGE ADDRESS
        // // ------------------------------------------

        case "change_order_address": {
            const data = JSON.parse(args) as ChangeOrderAddressRequest

            return changeOrderAddress(
                data.orderId,
                data.address
            )
        }

        // ------------------------------------------
        // UNKNOWN
        // ------------------------------------------

        default:
            return {
                error:
                    `Unknown tool: ${name}`,
            }
    }
}