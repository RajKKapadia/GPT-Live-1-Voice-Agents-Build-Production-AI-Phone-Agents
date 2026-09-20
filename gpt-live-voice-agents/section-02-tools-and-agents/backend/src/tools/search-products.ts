import { products } from "../data/store";

export const searchProductsTool = {
    type: "function" as const,

    name: "search_products",

    description:
        "Search Orbit Supply products by product name or category.",

    parameters: {
        type: "object",

        properties: {
            query: {
                type: "string",
                description:
                    "Product name, category, or keyword to search for.",
            },

            inStockOnly: {
                type: "boolean",
                description:
                    "If true, only return products currently in stock.",
            },
        },

        required: ["query"],
        additionalProperties: false,
    },

    strict: true,
};

export function searchProducts(
    query: string,
    inStockOnly = false
) {
    const normalizedQuery =
        query.toLowerCase().trim();

    const results = products.filter(
        (product) => {
            const matches =
                product.name
                    .toLowerCase()
                    .includes(normalizedQuery) ||
                product.category
                    .toLowerCase()
                    .includes(normalizedQuery);

            if (!matches) {
                return false;
            }

            if (
                inStockOnly &&
                product.stock <= 0
            ) {
                return false;
            }

            return true;
        }
    );

    return {
        query,
        count: results.length,

        products: results.map(
            (product) => ({
                id: product.id,
                name: product.name,
                category: product.category,
                price: product.price,
                stock: product.stock,
                available:
                    product.stock > 0,
            })
        ),
    };
}