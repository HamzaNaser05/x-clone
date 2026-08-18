import prisma from "../db/prisma.js";


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

        return res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications", error);
        return res.status(500).json({ message: "Error fetching notifications" });
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
        await prisma.notification.deleteUnique({
            where: {
                id: notificationId
            }
        })

        return res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        console.error("Error deleting notification", error);
        return res.status(500).json({ message: "Error deleting notification" });
    }
}