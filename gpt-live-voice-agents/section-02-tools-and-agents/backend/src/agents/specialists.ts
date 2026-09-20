import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

type Specialist =
    | "order"
    | "refund"
    | "product";

const SPECIALIST_INSTRUCTIONS: Record<
    Specialist,
    string
> = {
    order: `
You are the Orbit Supply Order Specialist.

You specialize in:
- order status
- shipping issues
- order modifications
- cancellations
- delivery-address problems

Analyze the supplied task carefully.

Do not claim that you performed an action.
Sensitive changes must still be executed through the main
tool system and require customer confirmation.

Return a concise recommendation suitable for another
customer-service agent.
`,

    refund: `
You are the Orbit Supply Refund and Returns Specialist.

You specialize in:
- returns
- refunds
- damaged products
- refund eligibility
- complicated return situations

Analyze the request and recommend the next appropriate action.

Do not issue refunds yourself.
Financial actions must go through the main tool system
and customer confirmation.
`,

    product: `
You are the Orbit Supply Product Specialist.

You specialize in:
- product questions
- comparisons
- compatibility
- product selection
- catalog-related questions

Provide concise factual guidance that the primary
customer-service agent can explain naturally.
`,
};

export async function runSpecialist({
    specialist,
    task,
    context,
}: {
    specialist: Specialist;
    task: string;
    context: string;
}) {
    const response =
        await openai.responses.create({
            model:
                process.env.SPECIALIST_MODEL ??
                "gpt-5.6-luna",

            reasoning: {
                effort: "low",
            },

            instructions:
                SPECIALIST_INSTRUCTIONS[specialist],

            input: `
Customer task:
${task}

Available context:
${context}
`,
        });

    return {
        specialist,
        recommendation:
            response.output_text,
    };
}