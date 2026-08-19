import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getNotifications } from "../controllers/notifications.controller.js";
import { deleteNotifications } from "../controllers/notifications.controller.js";
import { deleteNotification } from "../controllers/notifications.controller.js";
import { getUnreadNotificationCount } from "../controllers/notifications.controller.js";
import { streamNotifications } from "../controllers/notifications.controller.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications)
router.get("/unread-count", protectRoute, getUnreadNotificationCount)
router.get("/stream", protectRoute, streamNotifications)
router.delete("/", protectRoute, deleteNotifications)
router.delete("/:id", protectRoute, deleteNotification)

export default router;
