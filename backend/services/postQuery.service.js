export const getPostInclude = (userId) => ({
    author: {
        omit: { password: true, tokenVersion: true }
    },
    likes: true,
    reposts: true,
    bookmarks: {
        where: { userId },
        select: { userId: true }
    },
    _count: {
        select: { comments: true }
    }
});

export const serializePost = ({ bookmarks, _count, ...post }) => ({
    ...post,
    isBookmarked: bookmarks.length > 0,
    commentCount: _count.comments
});
