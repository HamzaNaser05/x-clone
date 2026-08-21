import express from "express";

import {
    deleteAdminComment,
    deleteAdminPost,
    getAdminComments,
    getAdminPosts,
    getAdminStats,
    getAdminUsers,
} from "../controllers/admin.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

router.use(protectRoute, requireAdmin);

router.get("/stats", getAdminStats);
router.get("/users", getAdminUsers);
router.get("/posts", getAdminPosts);
router.get("/comments", getAdminComments);
router.delete("/posts/:id", deleteAdminPost);
router.delete("/comments/:id", deleteAdminComment);

export default router;
