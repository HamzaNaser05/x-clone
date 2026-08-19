import prisma from "../db/prisma.js";
import { getPostInclude, serializePost } from "../services/postQuery.service.js";
import { createCursorPage, getPaginationParams } from "../utils/pagination.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getValidatedSearchParams = (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const pagination = getPaginationParams(req.query);

    if (query.length < 2) {
        res.status(400).json({ error: "Search must contain at least 2 characters" });
        return null;
    }

    if (query.length > 100) {
        res.status(400).json({ error: "Search cannot exceed 100 characters" });
        return null;
    }

    if (pagination.cursor && !UUID_PATTERN.test(pagination.cursor)) {
        res.status(400).json({ error: "Invalid pagination cursor" });
        return null;
    }

    return { query, ...pagination };
};

export const searchUsers = async (req, res) => {
    const params = getValidatedSearchParams(req, res);
    if (!params) return;

    try {
        const { query, cursor, limit } = params;
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: "insensitive" } },
                    { fullName: { contains: query, mode: "insensitive" } }
                ]
            },
            orderBy: [
                { username: "asc" },
                { id: "asc" }
            ],
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1
            }),
            omit: { password: true },
            include: {
                followers: {
                    where: { followerId: req.user.id },
                    select: { followerId: true },
                    take: 1
                },
                _count: {
                    select: {
                        followers: true,
                        following: true
                    }
                }
            }
        });
        const page = createCursorPage(users, limit);

        return res.status(200).json({
            users: page.items.map(({ followers, _count, ...user }) => ({
                ...user,
                isFollowing: followers.length > 0,
                followersCount: _count.followers,
                followingCount: _count.following
            })),
            nextCursor: page.nextCursor
        });
    } catch (error) {
        console.error("Error searching users:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const searchPosts = async (req, res) => {
    const params = getValidatedSearchParams(req, res);
    if (!params) return;

    try {
        const { query, cursor, limit } = params;
        const posts = await prisma.post.findMany({
            where: {
                text: {
                    contains: query,
                    mode: "insensitive"
                }
            },
            orderBy: [
                { createdAt: "desc" },
                { id: "desc" }
            ],
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1
            }),
            include: getPostInclude(req.user.id)
        });
        const page = createCursorPage(posts, limit);

        return res.status(200).json({
            posts: page.items.map(serializePost),
            nextCursor: page.nextCursor
        });
    } catch (error) {
        console.error("Error searching posts:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
