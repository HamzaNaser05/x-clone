import { useQuery } from "@tanstack/react-query";

import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { apiRequest } from "../../lib/api";

const Posts = ({ feedType = "forYou", username, profileUser }) => {
	const endpoint = {
		forYou: "/api/posts/all",
		following: "/api/posts/following",
		posts: username ? `/api/posts/user/${encodeURIComponent(username)}` : null,
		likes: "/api/posts/liked",
		bookmarks: "/api/posts/bookmarks",
	}[feedType];

	const {
		data: posts = [],
		isLoading,
		isFetching,
		isError,
		error,
	} = useQuery({
		queryKey: feedType === "bookmarks" ? ["bookmarkedPosts"] : ["posts", feedType, username],
		queryFn: async () => {
			const data = await apiRequest(endpoint);
			return Array.isArray(data) ? data : [];
		},
		enabled: Boolean(endpoint),
	});

	if (isLoading || (isFetching && posts.length === 0)) {
		return (
			<div className='flex flex-col'>
				<PostSkeleton />
				<PostSkeleton />
				<PostSkeleton />
			</div>
		);
	}

	if (isError) {
		return <p className='p-6 text-center text-sm text-red-400'>{error.message}</p>;
	}

	if (posts.length === 0) {
		return (
			<div className='px-6 py-14 text-center'>
				<p className='font-bold'>No posts yet</p>
				<p className='mt-1 text-sm text-slate-500'>There is nothing to show in this feed.</p>
			</div>
		);
	}

	return (
		<div>
			{posts.map((post) => (
				<Post
					key={post.id}
					post={{ ...post, author: post.author || post.user || profileUser }}
				/>
			))}
		</div>
	);
};

export default Posts;
