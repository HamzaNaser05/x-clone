import { useRef, useState } from "react";
import { FaRegComment } from "react-icons/fa";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import CommentItem from "./CommentItem";
import LoadingSpinner from "./LoadingSpinner";
import { apiRequest } from "../../lib/api";
import { updatePostCaches } from "../../lib/postCache";

const CommentsDialog = ({ postId, commentCount, authUserId }) => {
	const dialogRef = useRef(null);
	const [isOpen, setIsOpen] = useState(false);
	const [text, setText] = useState("");
	const queryClient = useQueryClient();
	const queryKey = ["comments", postId];

	const {
		data,
		isLoading,
		isError,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey,
		queryFn: ({ pageParam }) => {
			const params = new URLSearchParams({ limit: "10" });
			if (pageParam) params.set("cursor", pageParam);
			return apiRequest(`/api/posts/${postId}/comments?${params.toString()}`);
		},
		initialPageParam: null,
		getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
		enabled: isOpen,
	});
	const comments = data?.pages.flatMap((page) => page.comments) || [];

	const changeCommentCount = (amount) => {
		updatePostCaches(queryClient, postId, (post) => ({
			...post,
			commentCount: Math.max(0, (post.commentCount || 0) + amount),
		}));
	};

	const updateCommentInCache = (updatedComment) => {
		queryClient.setQueryData(queryKey, (cachedData) => {
			if (!cachedData?.pages) return cachedData;

			return {
				...cachedData,
				pages: cachedData.pages.map((page) => ({
					...page,
					comments: page.comments.map((comment) => (
						comment.id === updatedComment.id ? updatedComment : comment
					)),
				})),
			};
		});
	};

	const { mutate: createComment, isPending } = useMutation({
		mutationFn: () => apiRequest(`/api/posts/comment/${postId}`, {
			method: "POST",
			body: { text },
		}),
		onSuccess: (createdComment) => {
			queryClient.setQueryData(queryKey, (cachedData) => {
				if (!cachedData?.pages?.length) return cachedData;

				return {
					...cachedData,
					pages: cachedData.pages.map((page, index) => (
						index === 0
							? { ...page, comments: [createdComment, ...page.comments] }
							: page
					)),
				};
			});
			changeCommentCount(1);
			setText("");
			toast.success("Comment posted successfully");
		},
		onError: (mutationError) => toast.error(mutationError.message),
	});

	const submitComment = (event) => {
		event.preventDefault();
		if (!text.trim() || isPending) return;
		createComment();
	};

	const openDialog = () => {
		setIsOpen(true);
		dialogRef.current?.showModal();
	};

	return (
		<>
			<button
				type='button'
				className='group flex items-center gap-1 hover:text-sky-400'
				onClick={openDialog}
				aria-label='View comments'
			>
				<span className='rounded-full p-2 group-hover:bg-sky-400/10'><FaRegComment /></span>
				<span className='text-xs'>{commentCount}</span>
			</button>

			<dialog ref={dialogRef} className='modal' onClose={() => setIsOpen(false)}>
				<div className='modal-box flex max-h-[85vh] flex-col rounded-2xl border border-gray-700 bg-black'>
					<h3 className='mb-4 text-lg font-bold'>Comments</h3>
					<div className='flex min-h-24 flex-1 flex-col gap-4 overflow-auto'>
						{isLoading && <div className='grid min-h-24 place-items-center'><LoadingSpinner /></div>}
						{isError && <p className='text-sm text-red-400'>{error.message}</p>}
						{!isLoading && !isError && comments.length === 0 && (
							<p className='text-sm text-slate-500'>No comments yet. Be the first one.</p>
						)}
						{comments.map((comment) => (
							<CommentItem
								key={comment.id}
								comment={comment}
								authUserId={authUserId}
								onUpdated={updateCommentInCache}
								onReplyCreated={() => {
									updateCommentInCache({ ...comment, replyCount: (comment.replyCount || 0) + 1 });
									changeCommentCount(1);
								}}
							/>
						))}
						{hasNextPage && (
							<button
								type='button'
								className='btn btn-ghost btn-sm self-center rounded-full text-primary'
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
							>
								{isFetchingNextPage ? "Loading..." : "Load more comments"}
							</button>
						)}
					</div>
					<form className='mt-4 flex items-center gap-2 border-t border-gray-800 pt-3' onSubmit={submitComment}>
						<textarea
							className='textarea w-full resize-none rounded-xl border-gray-700 bg-transparent focus:outline-none'
							placeholder='Add a comment...'
							value={text}
							onChange={(event) => setText(event.target.value)}
						/>
						<button className='btn btn-primary btn-sm rounded-full text-white' disabled={!text.trim() || isPending}>
							{isPending ? <LoadingSpinner size='sm' /> : "Post"}
						</button>
					</form>
				</div>
				<form method='dialog' className='modal-backdrop'><button>Close</button></form>
			</dialog>
		</>
	);
};

export default CommentsDialog;
