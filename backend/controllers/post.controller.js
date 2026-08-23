import prisma from "../db/prisma.js";
import { deleteImage, uploadImage } from "../services/cloudinary.service.js";
import { publishNotification } from "../services/notificationStream.service.js";
import { getPostInclude, serializePost } from "../services/postQuery.service.js";
import { getProfileFeedPage } from "../services/profileFeed.service.js";
import { createCursorPage, getPaginationParams } from "../utils/pagination.js";

const getCommentInclude = () => ({
    user: {
        omit: { password: true }
    },
    _count: {
        select: { replies: true }
    }
});

const serializeComment = ({ _count, ...comment }) => ({
    ...comment,
    replyCount: _count.replies
});

const getPostPage = async ({ query, userId, where = {} }) => {
    const { cursor, limit } = getPaginationParams(query);
    const posts = await prisma.post.findMany({
        where,
        orderBy: [
            { createdAt: "desc" },
            { id: "desc" }
        ],
        take: limit + 1,
        ...(cursor && {
            cursor: { id: cursor },
            skip: 1
        }),
        include: getPostInclude(userId)
    });
    const page = createCursorPage(posts, limit);

    return {
        posts: page.items.map(serializePost),
        nextCursor: page.nextCursor
    };
};

export const createPost = async (req, res) => {
    try {
        const { text, img } = req.body;
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const trimmedText =
            typeof text === "string" ? text.trim() : "";

        if (!trimmedText && !img) {
            return res.status(400).json({ message: "Post must contain text or image" });
        }

        if (img && (typeof img !== "string" || !img.startsWith("data:image/"))) {
            return res.status(400).json({ message: "Invalid image format" });
        }

        let imageUrl = null;

        if (img) {
            imageUrl = await uploadImage(img);
        }

        const { post, followerIds } = await prisma.$transaction(async (tx) => {
            const followers = await tx.follow.findMany({
                where: { followingId: userId },
                select: { followerId: true }
            });
            const createdPost = await tx.post.create({
                data: {
                    text: trimmedText || null,
                    img: imageUrl,
                    authorId: userId
                },
                include: {
                    author: {
                        omit: { password: true }
                    }
                }
            });
            const recipientIds = followers.map(({ followerId }) => followerId);

            if (recipientIds.length > 0) {
                await tx.notification.createMany({
                    data: recipientIds.map((followerId) => ({
                        type: "post",
                        fromUserId: userId,
                        toUserId: followerId,
                        postId: createdPost.id
                    }))
                });
            }

            return {
                post: createdPost,
                followerIds: recipientIds
            };
        });

        for (const followerId of followerIds) {
            publishNotification(followerId, {
                type: "post",
                fromUserId: userId,
                toUserId: followerId,
                postId: post.id,
                createdAt: post.createdAt
            });
        }

        return res.status(201).json(post);
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deletePost = async (req, res) => {
    try {
        const post = await prisma.post.findUnique({
            where: {
                id: req.params.id
            }
        })
        if (!post) {
            return res.status(404).json({ error: "Post not found" })
        }
        if (post.authorId !== req.user.id) {
            return res.status(403).json({ error: "You are not authorized to delete this post" })
        }
        if (post.img) {
            await deleteImage(post.img);
        }

        await prisma.post.delete({
            where: {
                id: req.params.id
            }
        })
        res.status(200).json({ message: "Post deleted successfully" })
    } catch (error) {
        console.log("Error in deletePost controller: ", error);
        res.status(500).json({ error: "Internal Server Error" })
    }
}

export const updatePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

        if (!text) {
            return res.status(400).json({ error: "Post text is required" });
        }

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                id: true,
                authorId: true
            }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        if (post.authorId !== userId) {
            return res.status(403).json({ error: "You are not authorized to edit this post" });
        }

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: { text }
        });

        return res.status(200).json(updatedPost);
    } catch (error) {
        console.error("Error updating post:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const commentOnPost = async (req, res) => {
    try {
        const text = typeof req.body.text === "string" ? req.body.text.trim() : "";
        const postId = req.params.id;
        const userId = req.user.id;

        if (!text) {
            return res.status(400).json({ message: "Text field is required" });
        }
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                id: true,
                authorId: true
            }
        })
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const commentQuery = prisma.comment.create({
            data: {
                text,
                postId,
                userId
            },
            include: getCommentInclude()
        });

        if (post.authorId === userId) {
            const comment = await commentQuery;
            return res.status(201).json(serializeComment(comment));
        }

        const [comment, notification] = await prisma.$transaction([
            commentQuery,
            prisma.notification.create({
                data: {
                    type: "comment",
                    toUserId: post.authorId,
                    fromUserId: userId,
                    postId
                }
            })
        ]);

        publishNotification(post.authorId, notification);
        return res.status(201).json(serializeComment(comment));
    } catch (error) {
        console.error("Error commenting on post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.id;
        const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

        if (!text) {
            return res.status(400).json({ error: "Comment text is required" });
        }

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: {
                id: true,
                userId: true
            }
        });

        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ error: "You are not authorized to edit this comment" });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { text },
            include: getCommentInclude()
        });

        return res.status(200).json(serializeComment(updatedComment));
    } catch (error) {
        console.error("Error updating comment:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.id;
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: {
                id: true,
                userId: true,
                parentId: true,
                _count: {
                    select: { replies: true }
                }
            }
        });

        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ error: "You are not authorized to delete this comment" });
        }

        await prisma.comment.delete({
            where: { id: commentId }
        });

        return res.status(200).json({
            message: comment.parentId
                ? "Reply deleted successfully"
                : "Comment deleted successfully",
            deletedCommentId: comment.id,
            parentId: comment.parentId,
            deletedCount: 1 + comment._count.replies
        });
    } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getComments = async (req, res) => {
    try {
        const postId = req.params.id;
        const { cursor, limit } = getPaginationParams(req.query);
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const comments = await prisma.comment.findMany({
            where: {
                postId,
                parentId: null
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
            include: getCommentInclude()
        });
        const page = createCursorPage(comments, limit);

        return res.status(200).json({
            comments: page.items.map(serializeComment),
            nextCursor: page.nextCursor
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getReplies = async (req, res) => {
    try {
        const parentId = req.params.id;
        const { cursor, limit } = getPaginationParams(req.query);
        const parentComment = await prisma.comment.findUnique({
            where: { id: parentId },
            select: {
                id: true,
                parentId: true
            }
        });

        if (!parentComment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (parentComment.parentId) {
            return res.status(400).json({ error: "Replies can only be loaded for top-level comments" });
        }

        const replies = await prisma.comment.findMany({
            where: { parentId },
            orderBy: [
                { createdAt: "asc" },
                { id: "desc" }
            ],
            take: limit + 1,
            ...(cursor && {
                cursor: { id: cursor },
                skip: 1
            }),
            include: getCommentInclude()
        });
        const page = createCursorPage(replies, limit);

        return res.status(200).json({
            replies: page.items.map(serializeComment),
            nextCursor: page.nextCursor
        });
    } catch (error) {
        console.error("Error fetching replies:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const replyToComment = async (req, res) => {
    try {
        const parentId = req.params.id;
        const userId = req.user.id;
        const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

        if (!text) {
            return res.status(400).json({ error: "Reply text is required" });
        }

        const parentComment = await prisma.comment.findUnique({
            where: { id: parentId },
            select: {
                id: true,
                postId: true,
                userId: true,
                parentId: true
            }
        });

        if (!parentComment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        if (parentComment.parentId) {
            return res.status(400).json({ error: "Only one level of replies is supported" });
        }

        const replyQuery = prisma.comment.create({
            data: {
                text,
                postId: parentComment.postId,
                userId,
                parentId
            },
            include: getCommentInclude()
        });

        if (parentComment.userId === userId) {
            const reply = await replyQuery;
            return res.status(201).json(serializeComment(reply));
        }

        const [reply, notification] = await prisma.$transaction([
            replyQuery,
            prisma.notification.create({
                data: {
                    type: "reply",
                    toUserId: parentComment.userId,
                    fromUserId: userId,
                    postId: parentComment.postId
                }
            })
        ]);

        publishNotification(parentComment.userId, notification);
        return res.status(201).json(serializeComment(reply));
    } catch (error) {
        console.error("Error replying to comment:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const likeUnlikePost = async (req, res) => {

    try {
        const userId = req.user.id;
        const { id: postId } = req.params;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { likes: true }
        })

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        const userLikedPost = post.likes.some(like => like.userId === userId);
        if (userLikedPost) {
            // Unlike a post
            await prisma.like.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId
                    }
                }
            })
            return res.status(200).json({ message: "Post unliked successfully" });
        } else {
            //Like a post
            const likeQuery = prisma.like.create({
                data: {
                    postId,
                    userId
                }
            });

            if (post.authorId === userId) {
                await likeQuery;
                return res.status(200).json({ message: "Post liked successfully" });
            }

            const [, notification] = await prisma.$transaction([
                likeQuery,
                prisma.notification.create({
                    data: {
                        type: "like",
                        toUserId: post.authorId,
                        fromUserId: userId,
                        postId
                    }
                })
            ]);

            publishNotification(post.authorId, notification);
            return res.status(200).json({ message: "Post liked successfully" });
        }
    } catch (error) {
        console.log("Error in likeUnlikePost", error.message);
        res.status(500).json({ error: "Internal Server Error" })
    }
}

export const getPostById = async (req, res) => {
    try {
        const post = await prisma.post.findUnique({
            where: { id: req.params.id },
            include: getPostInclude(req.user.id)
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        return res.status(200).json(serializePost(post));
    } catch (error) {
        console.error("Error fetching post:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getAllPosts = async (req, res) => {
    try {
        const page = await getPostPage({
            query: req.query,
            userId: req.user.id
        });

        return res.status(200).json(page);
    } catch (error) {
        console.error("Error fetching all posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getLikedPosts = async (req, res) => {
    const userId = req.user.id;

    try {
        const page = await getPostPage({
            query: req.query,
            userId,
            where: {
                likes: {
                    some: { userId }
                }
            }
        });

        return res.status(200).json(page);
    } catch (error) {
        console.error("Error fetching liked posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const following = await prisma.follow.findMany({
            where: {
                followerId: userId
            },
            select: { followingId: true }
        });
        const page = await getPostPage({
            query: req.query,
            userId,
            where: {
                authorId: {
                    in: following.map(({ followingId }) => followingId)
                }
            }
        });

        return res.status(200).json(page);
    } catch (error) {
        console.error("Error fetching following posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                fullName: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const page = await getProfileFeedPage({
            profileUser: user,
            viewerId: req.user.id,
            query: req.query,
        });

        return res.status(200).json(page);
    } catch (error) {
        console.error("Error fetching user posts:", error);
        if (error.statusCode === 400) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}

export const bookmarkUnbookmarkPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: postId } = req.params;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { id: true }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const bookmark = await prisma.bookmark.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId
                }
            }
        });

        if (bookmark) {
            await prisma.bookmark.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId
                    }
                }
            });

            return res.status(200).json({
                message: "Post removed from bookmarks",
                bookmarked: false
            });
        }

        await prisma.bookmark.create({
            data: {
                postId,
                userId
            }
        });

        return res.status(200).json({
            message: "Post bookmarked successfully",
            bookmarked: true
        });
    } catch (error) {
        console.error("Error bookmarking post:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getBookmarkedPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cursor, limit } = getPaginationParams(req.query);

        const bookmarks = await prisma.bookmark.findMany({
            where: { userId },
            orderBy: [
                { createdAt: "desc" },
                { postId: "desc" }
            ],
            take: limit + 1,
            ...(cursor && {
                cursor: {
                    postId_userId: {
                        postId: cursor,
                        userId
                    }
                },
                skip: 1
            }),
            include: {
                post: {
                    include: getPostInclude(userId)
                }
            }
        });
        const page = createCursorPage(bookmarks, limit, ({ postId }) => postId);

        const posts = page.items.map(({ post }) => serializePost(post));

        return res.status(200).json({
            posts,
            nextCursor: page.nextCursor
        });
    } catch (error) {
        console.error("Error fetching bookmarked posts:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const repostUnrepostPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: postId } = req.params;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                id: true,
                authorId: true
            }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const repost = await prisma.repost.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId
                }
            }
        });

        if (repost) {
            await prisma.repost.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId
                    }
                }
            });
        } else if (post.authorId === userId) {
            await prisma.repost.create({
                data: {
                    postId,
                    userId
                }
            });
        } else {
            const [, notification] = await prisma.$transaction([
                prisma.repost.create({
                    data: {
                        postId,
                        userId
                    }
                }),
                prisma.notification.create({
                    data: {
                        type: "repost",
                        toUserId: post.authorId,
                        fromUserId: userId,
                        postId
                    }
                })
            ]);

            publishNotification(post.authorId, notification);
        }

        const reposts = await prisma.repost.findMany({
            where: { postId },
            orderBy: { createdAt: "asc" },
            select: { userId: true }
        });

        return res.status(200).json(reposts.map(({ userId: repostUserId }) => repostUserId));
    } catch (error) {
        console.error("Error reposting post:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
