import { v2 as cloudniary } from "cloudinary";
import prisma from "../db/prisma.js";
import { publishNotification } from "../services/notificationStream.service.js";

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

        if (!trimmedText) {
            return res.status(400).json({ message: "Post must contain text" });
        }
        if (!trimmedText && !img) {
            return res.status(400).json({ message: "Post must contain text or image" });
        }

        let imageUrl = null;

        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img)
            imageUrl = uploadedResponse.secure_url;
        }

        const post = await prisma.post.create({
            data: {
                text: trimmedText,
                img: imageUrl,
                authorId: userId

            },
            include: {
                author: {
                    omit: {
                        password: true
                    }
                }
            }
        })

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
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudniary.uploader.destroy(imgId);
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

export const commentOnPost = async (req, res) => {
    try {
        const { text } = req.body;
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
            include: {
                user: {
                    omit: {
                        password: true
                    }
                }
            }
        });

        if (post.authorId === userId) {
            const comment = await commentQuery;
            return res.status(201).json(comment);
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
        return res.status(201).json(comment);
    } catch (error) {
        console.error("Error commenting on post:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

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
            include: {
                author: {
                    omit: { password: true }
                },
                comments: {
                    orderBy: { createdAt: "asc" },
                    include: {
                        user: {
                            omit: { password: true }
                        }
                    }
                },
                likes: true,
                reposts: true
            }
        });

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        return res.status(200).json(post);
    } catch (error) {
        console.error("Error fetching post:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getAllPosts = async (req, res) => {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                author: {
                    omit: {
                        password: true
                    },
                },
                comments: {
                    include: {
                        user: {
                            omit: {
                                password: true
                            }
                        }
                    }
                },
                likes: true,
                reposts: true
            }
        }
        )

        if (posts.length === 0) {
            return res.status(204).json([]);
        }

        return res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching all posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getLikedPosts = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        }
        )
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const likedPosts = await prisma.post.findMany({
            where: {
                likes: {
                    some: {
                        userId
                    }
                }
            }, include: {
                author: {
                    omit: {
                        password: true
                    }
                },
                comments: {
                    include: {
                        user: {
                            omit: {
                                password: true
                            }
                        }
                    }
                },
                likes: true,
                reposts: true
            },
            orderBy: {
                createdAt: "desc"
            }
        })
        return res.status(200).json(likedPosts);
    } catch (error) {
        console.error("Error fetching liked posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                following: {
                    select: {
                        followingId: true
                    }
                }
            }
        })
        if (!user) return res.status(404).json({ error: "User not found" });

        const followingIds = user.following.map(followedUser => followedUser.followingId);

        if (followingIds.length === 0) {
            return res.status(200).json([]);
        }

        const posts = await prisma.post.findMany({
            where: {
                authorId: {
                    in: followingIds
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                author: {
                    omit: {
                        password: true
                    }
                },
                comments: {
                    include: {
                        user: {
                            omit: {
                                password: true
                            }
                        }
                    }
                },
                likes: true,
                reposts: true
            }
        })
        return res.status(200).json(posts);
    } catch (error) {
        console.error("Error fetching following posts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserPosts = async (req, res) => {
    try{
        const {username} = req.params;
        const user = await prisma.user.findUnique({
            where: {username},
            include: {
                posts: {
                    orderBy: {createdAt: "desc"},
                    include: {
                        comments: {
                            include: {
                                user: {
                                    omit: {password: true}
                                }
                            }
                        },
                        likes: true,
                        reposts: true
                    }
                }
            }
        })
        if(!user) return res.status(404).json({error: "User not found"});
        return res.status(200).json(user.posts);

    } catch(error){
        console.error("Error fetching user posts:", error);
        res.status(500).json({error: "Internal server error"});
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

        const bookmarks = await prisma.bookmark.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                post: {
                    include: {
                        author: {
                            omit: { password: true }
                        },
                        comments: {
                            include: {
                                user: {
                                    omit: { password: true }
                                }
                            }
                        },
                        likes: true,
                        reposts: true
                    }
                }
            }
        });

        const posts = bookmarks.map(({ post }) => ({
            ...post,
            isBookmarked: true
        }));

        return res.status(200).json(posts);
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
