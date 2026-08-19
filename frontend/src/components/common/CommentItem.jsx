import { useState } from "react";
import { FaPen, FaReply } from "react-icons/fa";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import LoadingSpinner from "./LoadingSpinner";
import { apiRequest } from "../../lib/api";
import { formatPostDate, wasEdited } from "../../utils/date";

const CommentItem = ({
	comment,
	authUserId,
	onUpdated,
	onReplyCreated,
	isReply = false,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [showReplyForm, setShowReplyForm] = useState(false);
	const [showReplies, setShowReplies] = useState(false);
	const [text, setText] = useState(comment.text);
	const [replyText, setReplyText] = useState("");
	const queryClient = useQueryClient();
	const repliesQueryKey = ["replies", comment.id];
	const isOwner = authUserId === (comment.userId || comment.user?.id);
	const replyCount = comment.replyCount || 0;

	const {
		data: repliesData,
		isLoading: areRepliesLoading,
		isError: areRepliesError,
		error: repliesError,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: repliesQueryKey,
		queryFn: ({ pageParam }) => {
			const params = new URLSearchParams({ limit: "5" });
			if (pageParam) params.set("cursor", pageParam);
			return apiRequest(`/api/posts/comments/${comment.id}/replies?${params.toString()}`);
		},
		initialPageParam: null,
		getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
		enabled: showReplies && !isReply,
	});
	const replies = repliesData?.pages.flatMap((page) => page.replies) || [];

	const { mutate: updateComment, isPending: isUpdating } = useMutation({
		mutationFn: () => apiRequest(`/api/posts/comments/${comment.id}`, {
			method: "PATCH",
			body: { text },
		}),
		onSuccess: (updatedComment) => {
			onUpdated(updatedComment);
			setIsEditing(false);
			toast.success(isReply ? "Reply updated successfully" : "Comment updated successfully");
		},
		onError: (error) => toast.error(error.message),
	});

	const { mutate: createReply, isPending: isReplying } = useMutation({
		mutationFn: () => apiRequest(`/api/posts/comments/${comment.id}/replies`, {
			method: "POST",
			body: { text: replyText },
		}),
		onSuccess: () => {
			setReplyText("");
			setShowReplyForm(false);
			setShowReplies(true);
			queryClient.invalidateQueries({ queryKey: repliesQueryKey });
			onReplyCreated?.();
			toast.success("Reply posted successfully");
		},
		onError: (error) => toast.error(error.message),
	});

	const updateReplyInCache = (updatedReply) => {
		queryClient.setQueryData(repliesQueryKey, (cachedData) => {
			if (!cachedData?.pages) return cachedData;

			return {
				...cachedData,
				pages: cachedData.pages.map((page) => ({
					...page,
					replies: page.replies.map((reply) => (
						reply.id === updatedReply.id ? updatedReply : reply
					)),
				})),
			};
		});
	};

	const cancelEdit = () => {
		setText(comment.text);
		setIsEditing(false);
	};

	const submitEdit = (event) => {
		event.preventDefault();
		if (!text.trim() || isUpdating) return;
		updateComment();
	};

	const submitReply = (event) => {
		event.preventDefault();
		if (!replyText.trim() || isReplying) return;
		createReply();
	};

	return (
		<div className={isReply ? "border-l border-gray-800 pl-3" : ""}>
			<div className='flex items-start gap-2'>
				<div className='avatar shrink-0'>
					<div className='w-8 rounded-full'>
						<img src={comment.user?.profileImg || "/avatar-placeholder.png"} alt='' />
					</div>
				</div>
				<div className='min-w-0 flex-1'>
					<div className='flex items-start gap-2'>
						<p className='flex min-w-0 flex-wrap items-center gap-1 text-sm'>
							<span className='font-bold'>{comment.user?.fullName}</span>
							<span className='text-slate-500'>@{comment.user?.username}</span>
							<span className='text-slate-500' aria-hidden='true'>·</span>
							<time className='text-slate-500' dateTime={comment.createdAt}>
								{formatPostDate(comment.createdAt)}
							</time>
							{wasEdited(comment.createdAt, comment.updatedAt) && (
								<span className='text-xs text-slate-500'>(edited)</span>
							)}
						</p>
						{isOwner && !isEditing && (
							<button
								type='button'
								className='ml-auto shrink-0 rounded-full p-1.5 text-slate-500 hover:bg-primary/10 hover:text-primary'
								onClick={() => setIsEditing(true)}
								aria-label={isReply ? "Edit reply" : "Edit comment"}
							>
								<FaPen className='h-3 w-3' />
							</button>
						)}
					</div>

					{isEditing ? (
						<form className='mt-2' onSubmit={submitEdit}>
							<textarea
								className='textarea min-h-20 w-full resize-none rounded-xl border-gray-700 bg-transparent focus:outline-none'
								value={text}
								onChange={(event) => setText(event.target.value)}
								autoFocus
							/>
							<div className='mt-2 flex justify-end gap-2'>
								<button type='button' className='btn btn-ghost btn-xs rounded-full' onClick={cancelEdit} disabled={isUpdating}>
									Cancel
								</button>
								<button
									type='submit'
									className='btn btn-primary btn-xs rounded-full text-white'
									disabled={!text.trim() || text.trim() === comment.text.trim() || isUpdating}
								>
									{isUpdating ? <LoadingSpinner size='sm' /> : "Save"}
								</button>
							</div>
						</form>
					) : (
						<p className='whitespace-pre-wrap break-words text-sm'>{comment.text}</p>
					)}

					{!isReply && !isEditing && (
						<div className='mt-1 flex items-center gap-3 text-xs'>
							<button
								type='button'
								className='flex items-center gap-1 text-slate-500 hover:text-primary'
								onClick={() => setShowReplyForm((current) => !current)}
							>
								<FaReply className='h-3 w-3' /> Reply
							</button>
							{replyCount > 0 && (
								<button
									type='button'
									className='text-primary hover:underline'
									onClick={() => setShowReplies((current) => !current)}
								>
									{showReplies ? "Hide replies" : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
								</button>
							)}
						</div>
					)}

					{showReplyForm && !isReply && (
						<form className='mt-2 flex items-end gap-2' onSubmit={submitReply}>
							<textarea
								className='textarea min-h-16 flex-1 resize-none rounded-xl border-gray-700 bg-transparent focus:outline-none'
								placeholder={`Reply to @${comment.user?.username || "user"}`}
								value={replyText}
								onChange={(event) => setReplyText(event.target.value)}
								autoFocus
							/>
							<button className='btn btn-primary btn-xs rounded-full text-white' disabled={!replyText.trim() || isReplying}>
								{isReplying ? <LoadingSpinner size='sm' /> : "Reply"}
							</button>
						</form>
					)}
				</div>
			</div>

			{showReplies && !isReply && (
				<div className='ml-10 mt-3 flex flex-col gap-3'>
					{areRepliesLoading && <LoadingSpinner size='sm' />}
					{areRepliesError && <p className='text-xs text-red-400'>{repliesError.message}</p>}
					{replies.map((reply) => (
						<CommentItem
							key={reply.id}
							comment={reply}
							authUserId={authUserId}
							onUpdated={updateReplyInCache}
							isReply
						/>
					))}
					{hasNextPage && (
						<button
							type='button'
							className='self-start text-xs text-primary hover:underline'
							onClick={() => fetchNextPage()}
							disabled={isFetchingNextPage}
						>
							{isFetchingNextPage ? "Loading..." : "Load more replies"}
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default CommentItem;
