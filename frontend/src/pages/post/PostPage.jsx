import { FaArrowLeft } from "react-icons/fa6";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import LoadingSpinner from "../../components/common/LoadingSpinner";
import Post from "../../components/common/Post";
import { apiRequest } from "../../lib/api";

const PostPage = () => {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const commentId = searchParams.get("comment");
	const { data: post, isLoading, isError, error } = useQuery({
		queryKey: ["post", id],
		queryFn: () => apiRequest(`/api/posts/${id}`),
		enabled: Boolean(id),
	});

	return (
		<main className='min-h-screen min-w-0 flex-[4_4_0] border-r border-gray-800'>
			<header className='sticky top-0 z-10 flex items-center gap-6 border-b border-gray-800 bg-black/80 px-4 py-3 backdrop-blur-md'>
				<Link to='/' className='rounded-full p-2 hover:bg-secondary' aria-label='Back to home'>
					<FaArrowLeft className='h-4 w-4' />
				</Link>
				<h1 className='text-xl font-bold'>Post</h1>
			</header>

			{isLoading && <div className='grid min-h-72 place-items-center'><LoadingSpinner size='lg' /></div>}
			{isError && (
				<div className='px-6 py-14 text-center'>
					<p className='font-bold'>Unable to open this post</p>
					<p className='mt-1 text-sm text-red-400'>{error.message}</p>
				</div>
			)}
			{post && <Post post={post} initialCommentId={commentId} />}
		</main>
	);
};

export default PostPage;
