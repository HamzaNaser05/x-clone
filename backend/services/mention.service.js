const MENTION_PATTERN = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{1,50})\b/g;
const MAX_MENTIONS = 10;

export const extractMentionHandles = (text = "") => {
    if (typeof text !== "string" || !text) return [];

    const handlesByLowercaseName = new Map();

    for (const match of text.matchAll(MENTION_PATTERN)) {
        const username = match[2];
        const normalizedUsername = username.toLowerCase();

        if (!handlesByLowercaseName.has(normalizedUsername)) {
            handlesByLowercaseName.set(normalizedUsername, username);
        }
        if (handlesByLowercaseName.size === MAX_MENTIONS) break;
    }

    return [...handlesByLowercaseName.entries()].map(([normalizedUsername, username]) => ({
        normalizedUsername,
        username,
    }));
};

const findMentionedUsers = async (database, text, fromUserId) => {
    const handles = extractMentionHandles(text);
    if (handles.length === 0) return [];

    const users = await database.user.findMany({
        where: {
            id: { not: fromUserId },
            OR: handles.map(({ username }) => ({
                username: { equals: username, mode: "insensitive" },
            })),
        },
        select: {
            id: true,
            username: true,
        },
    });

    return handles.flatMap(({ normalizedUsername, username }) => {
        const matchingUsers = users.filter(
            (user) => user.username.toLowerCase() === normalizedUsername
        );
        const exactMatch = matchingUsers.find((user) => user.username === username);

        if (exactMatch) return [exactMatch];
        return matchingUsers.length === 1 ? matchingUsers : [];
    });
};

export const syncMentionNotifications = async (
    database,
    { text, fromUserId, postId, commentId = null }
) => {
    const mentionedUsers = await findMentionedUsers(database, text, fromUserId);
    const recipientIds = mentionedUsers.map(({ id }) => id);
    const source = {
        type: "mention",
        fromUserId,
        postId,
        commentId,
    };
    const existingNotifications = await database.notification.findMany({
        where: source,
        select: {
            id: true,
            toUserId: true,
        },
    });
    const existingRecipientIds = new Set(
        existingNotifications.map(({ toUserId }) => toUserId)
    );
    const nextRecipientIds = new Set(recipientIds);
    const notificationsToDelete = existingNotifications.filter(
        ({ toUserId }) => !nextRecipientIds.has(toUserId)
    );
    const recipientIdsToAdd = recipientIds.filter(
        (toUserId) => !existingRecipientIds.has(toUserId)
    );

    if (notificationsToDelete.length > 0) {
        await database.notification.deleteMany({
            where: {
                id: { in: notificationsToDelete.map(({ id }) => id) },
            },
        });
    }

    const createdNotifications = recipientIdsToAdd.length > 0
        ? await database.notification.createManyAndReturn({
            data: recipientIdsToAdd.map((toUserId) => ({
                ...source,
                toUserId,
            })),
        })
        : [];

    return {
        recipientIds,
        createdNotifications,
        removedRecipientIds: notificationsToDelete.map(({ toUserId }) => toUserId),
    };
};
