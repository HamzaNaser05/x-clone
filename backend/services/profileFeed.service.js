import prisma from "../db/prisma.js";
import { getPaginationParams } from "../utils/pagination.js";
import { getPostInclude, serializePost } from "./postQuery.service.js";

const encodeCursor = ({ timestamp, key }) => Buffer.from(JSON.stringify({
    timestamp: timestamp.toISOString(),
    key
})).toString("base64url");

const decodeCursor = (cursor) => {
    if (!cursor) return null;

    try {
        const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
        const timestamp = new Date(parsed.timestamp);
        if (Number.isNaN(timestamp.getTime()) || typeof parsed.key !== "string") {
            throw new Error();
        }

        return { timestamp, key: parsed.key };
    } catch {
        const error = new Error("Invalid pagination cursor");
        error.statusCode = 400;
        throw error;
    }
};

const comesAfterCursor = (activity, cursor) => {
    if (!cursor) return true;

    const timeDifference = activity.timestamp.getTime() - cursor.timestamp.getTime();
    if (timeDifference !== 0) return timeDifference < 0;
    return activity.key.localeCompare(cursor.key) < 0;
};

const newestFirst = (first, second) => {
    const timeDifference = second.timestamp.getTime() - first.timestamp.getTime();
    return timeDifference || second.key.localeCompare(first.key);
};

export const getProfileFeedPage = async ({ profileUser, viewerId, query }) => {
    const { cursor: cursorToken, limit } = getPaginationParams(query);
    const cursor = decodeCursor(cursorToken);
    const createdAtFilter = cursor ? { lte: cursor.timestamp } : undefined;
    const candidateCount = limit + 1;
    const [authoredPosts, reposts] = await Promise.all([
        prisma.post.findMany({
            where: {
                authorId: profileUser.id,
                ...(createdAtFilter && { createdAt: createdAtFilter })
            },
            orderBy: [
                { createdAt: "desc" },
                { id: "desc" }
            ],
            take: candidateCount,
            include: getPostInclude(viewerId)
        }),
        prisma.repost.findMany({
            where: {
                userId: profileUser.id,
                ...(createdAtFilter && { createdAt: createdAtFilter })
            },
            orderBy: [
                { createdAt: "desc" },
                { postId: "desc" }
            ],
            take: candidateCount,
            include: {
                post: {
                    include: getPostInclude(viewerId)
                }
            }
        })
    ]);
    const activities = [
        ...authoredPosts.map((post) => ({
            timestamp: post.createdAt,
            key: `post:${post.id}`,
            post: {
                ...serializePost(post),
                repostedBy: null
            }
        })),
        ...reposts
            .filter(({ post }) => post.authorId !== profileUser.id)
            .map((repost) => ({
                timestamp: repost.createdAt,
                key: `repost:${repost.postId}`,
                post: {
                    ...serializePost(repost.post),
                    repostedBy: {
                        id: profileUser.id,
                        username: profileUser.username,
                        fullName: profileUser.fullName
                    }
                }
            }))
    ]
        .filter((activity) => comesAfterCursor(activity, cursor))
        .sort(newestFirst);
    const hasNextPage = activities.length > limit;
    const page = hasNextPage ? activities.slice(0, limit) : activities;

    return {
        posts: page.map(({ post }) => post),
        nextCursor: hasNextPage && page.length > 0
            ? encodeCursor(page[page.length - 1])
            : null
    };
};
