import { useState } from "react";
import { FaPen } from "react-icons/fa";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import LoadingSpinner from "./LoadingSpinner";
import { apiRequest } from "../../lib/api";
import { formatPostDate, wasEdited } from "../../utils/date";

const CommentItem = ({ comment, authUserId, onUpdated }) => {
	const [isEditing, setIsEditing] = useState(false);
	const [text, setText] = useState(comment.text);
	const isOwner = authUserId === (comment.userId || comment.user?.id);

	const { mutate: updateComment, isPending } = useMutation({
		mutationFn: () => apiRequest(`/api/posts/comments/${comment.id}`, {
			method: "PATCH",
			body: { text },
		}),
		onSuccess: (updatedComment) => {
			onUpdated(updatedComment);
			setIsEditing(false);
			toast.success("Comment updated successfully");
		},
		onError: (error) => toast.error(error.message),
	});

	const cancelEdit = () => {
		setText(comment.text);
		setIsEditing(false);
	};

	const submitEdit = (event) => {
		event.preventDefault();
		if (!text.trim() || isPending) return;
		updateComment();
	};

	return (
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
							aria-label='Edit comment'
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
							<button type='button' className='btn btn-ghost btn-xs rounded-full' onClick={cancelEdit} disabled={isPending}>
								Cancel
							</button>
							<button
								type='submit'
								className='btn btn-primary btn-xs rounded-full text-white'
								disabled={!text.trim() || text.trim() === comment.text.trim() || isPending}
							>
								{isPending ? <LoadingSpinner size='sm' /> : "Save"}
							</button>
						</div>
					</form>
				) : (
					<p className='whitespace-pre-wrap break-words text-sm'>{comment.text}</p>
				)}
			</div>
		</div>
	);
};

export default CommentItem;
