import prisma from "../db/prisma.js";
import { deleteImage } from "../services/cloudinary.service.js";
import { createCursorPage, getPaginationParams } from "../utils/pagination.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getListParams = (req, res) => {
    const search = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const pagination = getPaginationParams(req.query);

    if (search.length > 100) {
        res.status(400).json({ error: "Search cannot exceed 100 characters" });
        return null;
    }

    if (pagination.cursor && !UUID_PATTERN.test(pagination.cursor)) {
        res.status(400).json({ error: "Invalid pagination cursor" });
        return null;
    }

    return { search, ...pagination };
};

const hasValidId = (req, res) => {
    if (!UUID_PATTERN.test(req.params.id)) {
        res.status(400).json({ error: "Invalid resource ID" });
        return false;
    }

    return true;
};

export const getAdminStats = async (_req, res) => {
    try {
        const [users, posts, comments, reposts] = await Promise.all([
            prisma.user.count(),
            prisma.post.count(),
            prisma.comment.count(),
            prisma.repost.count(),
        ]);

        return res.status(200).json({ users, posts, comments, reposts });
    } catch (error) {
        console.error("Error fetching admin statistics:", error);
        return res.status(500).json({ error: "Unable to load dashboard statistics" });
    }
};

export const getAdminUsers = async (req, res) => {
    const params = getListParams(req, res);
    if (!params) return;

    try {
        const { search, cursor, limit } = params;
        const users = await prisma.user.findMany({
            where: search
                ? {
                    OR: [
                        { username: { contains: search, mode: "insensitive" } },
                        { fullName: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                    ],
                }
                : undefined,
            orderBy: [
                { createdAt: "desc" },
                { id: "desc" },
            ],
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                profileImg: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: true,
                        comments: true,
                        followers: true,
                    },
                },
            },
        });
        const page = createCursorPage(users, limit);

        return res.status(200).json({
            users: page.items,
            nextCursor: page.nextCursor,
        });
    } catch (error) {
        console.error("Error fetching admin users:", error);
        return res.status(500).json({ error: "Unable to load users" });
    }
};

export const getAdminPosts = async (req, res) => {
    const params = getListParams(req, res);
    if (!params) return;

    try {
        const { search, cursor, limit } = params;
        const posts = await prisma.post.findMany({
            where: search
                ? {
                    OR: [
                        { text: { contains: search, mode: "insensitive" } },
                        { author: { username: { contains: search, mode: "insensitive" } } },
                        { author: { fullName: { contains: search, mode: "insensitive" } } },
                    ],
                }
                : undefined,
            orderBy: [
                { createdAt: "desc" },
                { id: "desc" },
            ],
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            select: {
                id: true,
                text: true,
                img: true,
                createdAt: true,
                updatedAt: true,
                author: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        profileImg: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        likes: true,
                        reposts: true,
                    },
                },
            },
        });
        const page = createCursorPage(posts, limit);

        return res.status(200).json({
            posts: page.items,
            nextCursor: page.nextCursor,
        });
    } catch (error) {
        console.error("Error fetching admin posts:", error);
        return res.status(500).json({ error: "Unable to load posts" });
    }
};

export const getAdminComments = async (req, res) => {
    const params = getListParams(req, res);
    if (!params) return;

    try {
        const { search, cursor, limit } = params;
        const comments = await prisma.comment.findMany({
            where: search
                ? {
                    OR: [
                        { text: { contains: search, mode: "insensitive" } },
                        { user: { username: { contains: search, mode: "insensitive" } } },
                        { user: { fullName: { contains: search, mode: "insensitive" } } },
                    ],
                }
                : undefined,
            orderBy: [
                { createdAt: "desc" },
                { id: "desc" },
            ],
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1,
            }),
            select: {
                id: true,
                text: true,
                parentId: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                        profileImg: true,
                        role: true,
                    },
                },
                post: {
                    select: {
                        id: true,
                        text: true,
                    },
                },
                _count: {
                    select: { replies: true },
                },
            },
        });
        const page = createCursorPage(comments, limit);

        return res.status(200).json({
            comments: page.items,
            nextCursor: page.nextCursor,
        });
    } catch (error) {
        console.error("Error fetching admin comments:", error);
        return res.status(500).json({ error: "Unable to load comments" });
    }
};

export const deleteAdminPost = async (req, res) => {
    if (!hasValidId(req, res)) return;

    try {
        const post = await prisma.post.findUnique({
            where: { id: req.params.id },
            select: { id: true, img: true },
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        await prisma.post.delete({ where: { id: post.id } });
        await deleteImage(post.img);

        return res.status(200).json({ message: "Post removed by administrator" });
    } catch (error) {
        console.error("Error deleting admin post:", error);
        return res.status(500).json({ error: "Unable to delete post" });
    }
};

export const deleteAdminComment = async (req, res) => {
    if (!hasValidId(req, res)) return;

    try {
        const comment = await prisma.comment.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                _count: { select: { replies: true } },
            },
        });

        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        await prisma.comment.delete({ where: { id: comment.id } });

        return res.status(200).json({
            message: "Comment removed by administrator",
            deletedCount: 1 + comment._count.replies,
        });
    } catch (error) {
        console.error("Error deleting admin comment:", error);
        return res.status(500).json({ error: "Unable to delete comment" });
    }
};
