import {
    getActionLog,
    type RuntimeContext,
} from "../runtime/action-runtime";

import {
    findCustomerById,
} from "../data/store";

type CreateEscalationArgs = {
    context: RuntimeContext;
    reason: string;
    conversationSummary: string;
    problemDescription: string;
};

export async function createEscalation({
    context,
    reason,
    conversationSummary,
    problemDescription,
}: CreateEscalationArgs) {
    const customer =
        findCustomerById(
            context.customerId
        );

    const attemptedActions =
        getActionLog(
            context.sessionId
        );

    const escalation = {
        caseId: `CASE-${crypto
            .randomUUID()
            .slice(0, 8)
            .toUpperCase()}`,

        createdAt:
            new Date().toISOString(),

        customer: customer
            ? {
                id: customer.id,
                name: `${customer.name}`,
                email: customer.email,
                phone: customer.phone,
                tier:
                    customer.tier,
            }
            : {
                id: context.customerId,
            },

        reason,

        conversationSummary,

        problemDescription,

        attemptedActions,
    };

    /*
     * Production:
     *
     * await zendesk.createTicket(...)
     * await salesforce.createCase(...)
     * await sendToHumanQueue(...)
     *
     * For the course we'll simply log it.
     */

    console.log(
        "\n========== HUMAN ESCALATION =========="
    );

    console.dir(
        escalation,
        {
            depth: null,
        }
    );

    console.log(
        "======================================\n"
    );

    return escalation;
}

export const escalateToHumanTool = {
    type: "function" as const,

    name: "escalate_to_human",

    description:
        "Escalate the current conversation to a human support agent. Use when the customer explicitly requests a human, when permission is insufficient, after repeated tool failures, or when the issue is too sensitive or complex.",

    parameters: {
        type: "object",

        properties: {
            reason: {
                type: "string",
                enum: [
                    "customer_requested_human",
                    "permission_required",
                    "repeated_tool_failure",
                    "sensitive_or_complex_issue",
                ],
            },

            conversationSummary: {
                type: "string",
                description:
                    "A concise summary of the relevant conversation for the human agent.",
            },

            problemDescription: {
                type: "string",
                description:
                    "A clear description of the unresolved problem.",
            },
        },

        required: [
            "reason",
            "conversationSummary",
            "problemDescription",
        ],

        additionalProperties: false,
    },
};