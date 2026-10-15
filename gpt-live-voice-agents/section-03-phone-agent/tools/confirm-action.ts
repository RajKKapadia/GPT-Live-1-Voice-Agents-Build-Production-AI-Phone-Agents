export const confirmActionTool = {
    type: "function" as const,

    name: "confirm_action",

    description:
        "Confirm and execute a previously prepared sensitive action. Only call this after the customer has explicitly confirmed that they want the action performed.",

    parameters: {
        type: "object",
        properties: {
            confirmationId: {
                type: "string",
                description:
                    "The confirmation ID returned by the sensitive action tool.",
            },
        },
        required: ["confirmationId"],
        additionalProperties: false,
    },
};