import express from "express";
import { createPost } from "../controllers/post.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { deletePost } from "../controllers/post.controller.js";
import { commentOnPost } from "../controllers/post.controller.js";
import { likeUnlikePost } from "../controllers/post.controller.js";
import { getAllPosts } from "../controllers/post.controller.js";
import { getLikedPosts } from "../controllers/post.controller.js";
import { getFollowingPosts } from "../controllers/post.controller.js";
import { getUserPosts } from "../controllers/post.controller.js";

const router = express.Router();

router.get("/all", protectRoute, getAllPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/user/:username", protectRoute, getUserPosts);
router.get("/liked", protectRoute, getLikedPosts);
router.post("/create", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.delete("/:id", protectRoute, deletePost);


export default router;