export const delegateToSpecialistTool = {
    type: "function" as const,

    name: "delegate_to_specialist",

    description:
        "Delegate a complex domain-specific support problem to an Order, Refund, or Product specialist. Do not use this for simple lookups that existing tools can answer directly.",

    parameters: {
        type: "object",

        properties: {
            specialist: {
                type: "string",
                enum: [
                    "order",
                    "refund",
                    "product",
                ],
            },

            task: {
                type: "string",
                description:
                    "The problem the specialist should analyze.",
            },

            context: {
                type: "string",
                description:
                    "Relevant order, product, customer, or conversation context already collected.",
            },
        },

        required: [
            "specialist",
            "task",
            "context",
        ],

        additionalProperties: false,
    },
};