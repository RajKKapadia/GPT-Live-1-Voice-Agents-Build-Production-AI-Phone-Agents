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
                    "Product name, category, or keywords only, without conversational wording. Use an empty string to list all products.",
            },

            inStockOnly: {
                type: "boolean",
                description:
                    "If true, only return products currently in stock. Use false when no stock filter is requested.",
            },
        },

        required: ["query", "inStockOnly"],
        additionalProperties: false,
    },

    strict: true,
};

function searchTerms(value: string) {
    return (value.toLowerCase().match(/[a-z0-9]+/g) ?? [])
        .map((word) => {
            if (word.length > 4 && word.endsWith("ies")) {
                return word.slice(0, -3) + "y";
            }

            if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
                return word.slice(0, -1);
            }

            return word;
        });
}

export function searchProducts(
    query: string,
    inStockOnly = false
) {
    const queryTerms = searchTerms(query);

    const results = products.filter(
        (product) => {
            const productTerms = searchTerms(
                `${product.name} ${product.category}`
            );
            const matches = queryTerms.every(
                (term) => productTerms.includes(term)
            );

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
