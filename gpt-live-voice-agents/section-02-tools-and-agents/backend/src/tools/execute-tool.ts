import { getOrder } from "./get-order";

import {
    getShipment,
} from "./get-shipment";

import {
    searchProducts,
} from "./search-products";

import {
    getReturnStatus,
} from "./get-return-status";

import {
    requestReturn,
} from "./request-return";

import {
    changeOrderAddress,
} from "./change-order-address";

import type {
    Address,
} from "../data/types";


export async function executeTool(
    name: string,
    args: Record<string, unknown>
) {
    console.log(
        `Executing tool: ${name}`
    );

    console.log(
        "Arguments:",
        args
    );

    switch (name) {
        // ------------------------------------------
        // GET ORDER
        // ------------------------------------------

        case "get_order": {
            const orderId =
                args.orderId;

            if (
                typeof orderId !== "string"
            ) {
                return {
                    error:
                        "orderId is required",
                };
            }

            return getOrder(orderId);
        }

        // ------------------------------------------
        // GET SHIPMENT
        // ------------------------------------------

        case "get_shipment": {
            const orderId =
                args.orderId;

            if (
                typeof orderId !== "string"
            ) {
                return {
                    error:
                        "orderId is required",
                };
            }

            return getShipment(orderId);
        }

        // ------------------------------------------
        // SEARCH PRODUCTS
        // ------------------------------------------

        case "search_products": {
            const query =
                args.query;

            const inStockOnly =
                args.inStockOnly;

            if (
                typeof query !== "string"
            ) {
                return {
                    error:
                        "query is required",
                };
            }

            return searchProducts(
                query,
                typeof inStockOnly ===
                    "boolean"
                    ? inStockOnly
                    : false
            );
        }

        // ------------------------------------------
        // GET RETURN STATUS
        // ------------------------------------------

        case "get_return_status": {
            const orderId =
                args.orderId;

            if (
                typeof orderId !== "string"
            ) {
                return {
                    error:
                        "orderId is required",
                };
            }

            return getReturnStatus(
                orderId
            );
        }

        // ------------------------------------------
        // REQUEST RETURN
        // ------------------------------------------

        case "request_return": {
            const orderId =
                args.orderId;

            const reason =
                args.reason;

            if (
                typeof orderId !== "string" ||
                typeof reason !== "string"
            ) {
                return {
                    error:
                        "orderId and reason are required",
                };
            }

            return requestReturn(
                orderId,
                reason
            );
        }

        // ------------------------------------------
        // CHANGE ADDRESS
        // ------------------------------------------

        case "change_order_address": {
            const orderId =
                args.orderId;

            const address =
                args.address;

            if (
                typeof orderId !==
                "string" ||
                typeof address !==
                "object" ||
                address === null
            ) {
                return {
                    error:
                        "orderId and address are required",
                };
            }

            return changeOrderAddress(
                orderId,
                address as Address
            );
        }

        // ------------------------------------------
        // UNKNOWN
        // ------------------------------------------

        default:
            return {
                error:
                    `Unknown tool: ${name}`,
            };
    }
}