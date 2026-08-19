import prisma from "../db/prisma.js";
import {
    addNotificationClient,
    publishUnreadCount,
    sendNotificationEvent
} from "../services/notificationStream.service.js";


export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const notifications = await prisma.notification.findMany({
            where: {
                toUserId: userId
            },
            include: {
                from: {
                    select: {
                        id: true,
                        username: true,
                        profileImg: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        await prisma.notification.updateMany({
            where: {
                toUserId: userId,
                read: false
            },
            data: {
                read: true
            }
        });

        publishUnreadCount(userId, 0);

        return res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications", error);
        return res.status(500).json({ message: "Error fetching notifications" });
    }
};

export const getUnreadNotificationCount = async (req, res) => {
    try {
        const count = await prisma.notification.count({
            where: {
                toUserId: req.user.id,
                read: false
            }
        });

        return res.status(200).json({ count });
    } catch (error) {
        console.error("Error fetching unread notification count", error);
        return res.status(500).json({ message: "Error fetching unread notification count" });
    }
};

export const streamNotifications = async (req, res) => {
    const userId = req.user.id;

    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no"
    });
    res.flushHeaders();
    res.write("retry: 5000\n\n");

    const removeClient = addNotificationClient(userId, res);
    const heartbeat = setInterval(() => {
        res.write(": heartbeat\n\n");
    }, 25_000);

    const closeStream = () => {
        clearInterval(heartbeat);
        removeClient();
    };

    req.on("close", closeStream);

    try {
        const count = await prisma.notification.count({
            where: {
                toUserId: userId,
                read: false
            }
        });

        sendNotificationEvent(res, "unread-count", { count });
    } catch (error) {
        console.error("Error opening notification stream", error);
        closeStream();
        res.end();
    }
};

export const deleteNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.notification.deleteMany({
            where: {
                toUserId: userId
            }
        });
        publishUnreadCount(userId, 0);
        return res.status(200).json({ message: "Notifications deleted successfully" });
    } catch (error) {
        console.error("Error deleting notifications", error);
        return res.status(500).json({ message: "Error deleting notifications" });
    }
}

export const deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;

        const notification = await prisma.notification.findUnique({
            where: {
                id: notificationId
            }
        })
        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }
        if (notification.toUserId !== userId) {
            return res.status(403).json({ message: "You are not authorized to delete this notification" });
        }
        await prisma.notification.delete({
            where: {
                id: notificationId
            }
        })

        const unreadCount = await prisma.notification.count({
            where: {
                toUserId: userId,
                read: false
            }
        });
        publishUnreadCount(userId, unreadCount);

        return res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Error deleting notification", error);
        return res.status(500).json({ message: "Error deleting notification" });
    }
}
