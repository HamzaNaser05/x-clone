import express from "express";
import {
    bookmarkUnbookmarkPost,
    commentOnPost,
    createPost,
    deleteComment,
    deletePost,
    getAllPosts,
    getBookmarkedPosts,
    getComments,
    getFollowingPosts,
    getLikedPosts,
    getPostById,
    getReplies,
    getUserPosts,
    likeUnlikePost,
    replyToComment,
    repostUnrepostPost,
    updateComment,
    updatePost
} from "../controllers/post.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/all", protectRoute, getAllPosts);
router.get("/following", protectRoute, getFollowingPosts);
router.get("/user/:username", protectRoute, getUserPosts);
router.get("/liked", protectRoute, getLikedPosts);
router.get("/bookmarks", protectRoute, getBookmarkedPosts);
router.get("/comments/:id/replies", protectRoute, getReplies);
router.get("/:id/comments", protectRoute, getComments);
router.get("/:id", protectRoute, getPostById);
router.post("/create", protectRoute, createPost);
router.post("/like/:id", protectRoute, likeUnlikePost);
router.post("/comment/:id", protectRoute, commentOnPost);
router.post("/comments/:id/replies", protectRoute, replyToComment);
router.post("/bookmark/:id", protectRoute, bookmarkUnbookmarkPost);
router.post("/repost/:id", protectRoute, repostUnrepostPost);
router.patch("/comments/:id", protectRoute, updateComment);
router.patch("/:id", protectRoute, updatePost);
router.delete("/comments/:id", protectRoute, deleteComment);
router.delete("/:id", protectRoute, deletePost);


export default router;
