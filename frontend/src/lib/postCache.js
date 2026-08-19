const updatePostCollection = (cachedData, postId, updater) => {
	if (Array.isArray(cachedData)) {
		return cachedData.map((post) => (post.id === postId ? updater(post) : post));
	}

	if (Array.isArray(cachedData?.pages)) {
		return {
			...cachedData,
			pages: cachedData.pages.map((page) => ({
				...page,
				posts: Array.isArray(page.posts)
					? page.posts.map((post) => (post.id === postId ? updater(post) : post))
					: page.posts,
			})),
		};
	}

	return cachedData;
};

export const updatePostCaches = (queryClient, postId, updater) => {
	queryClient.setQueriesData(
		{ queryKey: ["posts"] },
		(cachedData) => updatePostCollection(cachedData, postId, updater),
	);
	queryClient.setQueriesData(
		{ queryKey: ["search", "posts"] },
		(cachedData) => updatePostCollection(cachedData, postId, updater),
	);
	queryClient.setQueryData(["post", postId], (cachedPost) => (
		cachedPost ? updater(cachedPost) : cachedPost
	));
};
