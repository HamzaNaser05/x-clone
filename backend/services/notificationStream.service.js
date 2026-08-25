const clientsByUser = new Map();

const writeEvent = (response, eventName, payload) => {
    response.write(`event: ${eventName}\n`);
    response.write(`data: ${JSON.stringify(payload)}\n\n`);
};

export const addNotificationClient = (userId, response) => {
    const userClients = clientsByUser.get(userId) || new Set();
    userClients.add(response);
    clientsByUser.set(userId, userClients);

    return () => {
        userClients.delete(response);
        if (userClients.size === 0) {
            clientsByUser.delete(userId);
        }
    };
};

export const sendNotificationEvent = (response, eventName, payload) => {
    writeEvent(response, eventName, payload);
};

export const publishNotification = (userId, notification) => {
    const userClients = clientsByUser.get(userId);
    if (!userClients) return;

    for (const response of userClients) {
        writeEvent(response, "notification", notification);
    }
};

export const publishNotificationRefresh = (userId) => {
    const userClients = clientsByUser.get(userId);
    if (!userClients) return;

    for (const response of userClients) {
        writeEvent(response, "notification-refresh", {});
    }
};

export const publishUnreadCount = (userId, count) => {
    const userClients = clientsByUser.get(userId);
    if (!userClients) return;

    for (const response of userClients) {
        writeEvent(response, "unread-count", { count });
    }
};
