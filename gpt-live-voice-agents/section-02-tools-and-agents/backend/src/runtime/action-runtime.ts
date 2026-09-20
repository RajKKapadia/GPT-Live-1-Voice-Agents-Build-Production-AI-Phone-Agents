export type RuntimeContext = {
    sessionId: string;
    customerId: string;
};

export type ToolSuccess = {
    status: "success";
    data: unknown;
};

export type ToolConfirmationRequired = {
    status: "confirmation_required";
    confirmationId: string;
    message: string;
};

export type ToolFailure = {
    status: "error";
    error: {
        code: string;
        message: string;
        retryable: boolean;
    };
    failureCount: number;
    escalationRecommended: boolean;
};

export type ToolResult =
    | ToolSuccess
    | ToolConfirmationRequired
    | ToolFailure;

export class ToolError extends Error {
    constructor(
        public code: string,
        public userMessage: string,
        public retryable = false,
        public forceEscalation = false
    ) {
        super(userMessage);
    }
}

type PendingAction = {
    id: string;
    sessionId: string;
    toolName: string;
    args: Record<string, unknown>;
    description: string;
    createdAt: number;
};

const pendingActions = new Map<string, PendingAction>();

export function createPendingAction(
    sessionId: string,
    toolName: string,
    args: Record<string, unknown>,
    description: string
) {
    const id = crypto.randomUUID();

    pendingActions.set(id, {
        id,
        sessionId,
        toolName,
        args,
        description,
        createdAt: Date.now(),
    });

    return id;
}

export function consumePendingAction(
    confirmationId: string,
    sessionId: string
) {
    const action = pendingActions.get(confirmationId);

    if (!action) {
        throw new ToolError(
            "CONFIRMATION_NOT_FOUND",
            "That confirmation request is no longer available. We can prepare the action again."
        );
    }

    if (action.sessionId !== sessionId) {
        throw new ToolError(
            "INVALID_CONFIRMATION",
            "That confirmation does not belong to this conversation."
        );
    }

    // Expire after 5 minutes.
    if (Date.now() - action.createdAt > 5 * 60 * 1000) {
        pendingActions.delete(confirmationId);

        throw new ToolError(
            "CONFIRMATION_EXPIRED",
            "That confirmation has expired. We can prepare the action again."
        );
    }

    // One-time use.
    pendingActions.delete(confirmationId);

    return action;
}

export type ActionLogEntry = {
    toolName: string;
    status:
    | "success"
    | "failed"
    | "confirmation_required"
    | "delegated"
    | "escalated";
    timestamp: string;
    details?: string;
};

const actionLogs = new Map<string, ActionLogEntry[]>();

export function logAction(
    sessionId: string,
    entry: Omit<ActionLogEntry, "timestamp">
) {
    const entries = actionLogs.get(sessionId) ?? [];

    entries.push({
        ...entry,
        timestamp: new Date().toISOString(),
    });

    actionLogs.set(sessionId, entries);
}

export function getActionLog(sessionId: string) {
    return actionLogs.get(sessionId) ?? [];
}

const failureCounts = new Map<string, number>();

function getFailureKey(
    sessionId: string,
    toolName: string
) {
    return `${sessionId}:${toolName}`;
}

export function recordFailure(
    sessionId: string,
    toolName: string
) {
    const key = getFailureKey(sessionId, toolName);

    const count =
        (failureCounts.get(key) ?? 0) + 1;

    failureCounts.set(key, count);

    return count;
}

export function clearFailures(
    sessionId: string,
    toolName: string
) {
    failureCounts.delete(
        getFailureKey(sessionId, toolName)
    );
}
