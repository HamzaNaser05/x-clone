import express from "express";

import { searchPosts, searchUsers } from "../controllers/search.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/users", protectRoute, searchUsers);
router.get("/posts", protectRoute, searchPosts);

export default router;
