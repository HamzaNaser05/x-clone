import { useInfiniteQuery } from "@tanstack/react-query";

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
		data,
		isLoading,
		isError,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ["posts", feedType, username || null],
		queryFn: ({ pageParam }) => {
			const params = new URLSearchParams({ limit: "10" });
			if (pageParam) params.set("cursor", pageParam);
			return apiRequest(`${endpoint}?${params.toString()}`);
		},
		initialPageParam: null,
		getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
		enabled: Boolean(endpoint),
	});
	const posts = data?.pages.flatMap((page) => page.posts) || [];

	if (isLoading) {
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
			{hasNextPage && (
				<div className='flex justify-center border-b border-gray-800 p-4'>
					<button
						type='button'
						className='btn btn-ghost btn-sm rounded-full text-primary'
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
					>
						{isFetchingNextPage ? "Loading..." : "Load more posts"}
					</button>
				</div>
			)}
		</div>
	);
};

export default Posts;
