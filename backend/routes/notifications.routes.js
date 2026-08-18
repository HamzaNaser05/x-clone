import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getNotifications } from "../controllers/notifications.controller.js";
import { deleteNotifications } from "../controllers/notifications.controller.js";
import { deleteNotification } from "../controllers/notifications.controller.js";

const router = express.Router();

router.get("/", protectRoute, getNotifications)
router.delete("/", protectRoute, deleteNotifications)
router.delete("/:id", protectRoute, deleteNotification)

export default router;