import { useRef, useState } from "react";
import { FaPen } from "react-icons/fa";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import LoadingSpinner from "./LoadingSpinner";
import MentionTextarea from "./MentionTextarea";
import { apiRequest } from "../../lib/api";

const EditPostDialog = ({ post, onUpdated }) => {
	const dialogRef = useRef(null);
	const [text, setText] = useState(post.text || "");

	const { mutate: updatePost, isPending } = useMutation({
		mutationFn: () => apiRequest(`/api/posts/${post.id}`, {
			method: "PATCH",
			body: { text },
		}),
		onSuccess: (updatedPost) => {
			onUpdated(updatedPost);
			dialogRef.current?.close();
			toast.success("Post updated successfully");
		},
		onError: (error) => toast.error(error.message),
	});

	const openDialog = () => {
		setText(post.text || "");
		dialogRef.current?.showModal();
	};

	const submitEdit = (event) => {
		event.preventDefault();
		if (!text.trim() || isPending) return;
		updatePost();
	};

	return (
		<>
			<button
				type='button'
				className='rounded-full p-2 text-slate-500 hover:bg-primary/10 hover:text-primary'
				onClick={openDialog}
				aria-label='Edit post'
			>
				<FaPen className='h-3.5 w-3.5' />
			</button>

			<dialog ref={dialogRef} className='modal' aria-labelledby={`edit-post-title-${post.id}`}>
				<form className='modal-box rounded-2xl border border-gray-700 bg-black' onSubmit={submitEdit}>
					<h2 id={`edit-post-title-${post.id}`} className='text-xl font-bold'>Edit post</h2>
					<MentionTextarea
						className='textarea mt-4 min-h-32 w-full resize-none rounded-xl border-gray-700 bg-transparent focus:outline-none'
						value={text}
						onValueChange={setText}
						autoFocus
					/>
					<p className='mt-2 text-xs text-slate-500'>The post image will stay unchanged.</p>
					<div className='modal-action'>
						<button
							type='button'
							className='btn btn-ghost rounded-full'
							onClick={() => dialogRef.current?.close()}
							disabled={isPending}
						>
							Cancel
						</button>
						<button
							type='submit'
							className='btn btn-primary rounded-full text-white'
							disabled={!text.trim() || text.trim() === (post.text || "").trim() || isPending}
						>
							{isPending ? <LoadingSpinner size='sm' /> : "Save"}
						</button>
					</div>
				</form>
				<form method='dialog' className='modal-backdrop'>
					<button disabled={isPending}>Close</button>
				</form>
			</dialog>
		</>
	);
};

export default EditPostDialog;
