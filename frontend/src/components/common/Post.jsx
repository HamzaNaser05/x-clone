import { useRef } from "react";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart, FaTrash } from "react-icons/fa";
import { FaBookmark, FaHeart, FaRegBookmark } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import CommentsDialog from "./CommentsDialog";
import EditPostDialog from "./EditPostDialog";
import LoadingSpinner from "./LoadingSpinner";
import { apiRequest } from "../../lib/api";
import { updatePostCaches } from "../../lib/postCache";
import { formatPostDate, wasEdited } from "../../utils/date";

const ownerId = (item) => (typeof item === "string" ? item : item?.userId || item?.id);

const Post = ({ post }) => {
	const deleteDialogRef = useRef(null);
	const queryClient = useQueryClient();
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	const postOwner = post.author || {};
	const likes = Array.isArray(post.likes) ? post.likes : [];
	const reposts = Array.isArray(post.reposts) ? post.reposts : [];
	const isLiked = likes.some((like) => ownerId(like) === authUser?.id);
	const isBookmarked = Boolean(post.isBookmarked);
	const commentCount = post.commentCount || 0;
	const isMyPost = authUser?.id === (post.authorId || postOwner.id);

	const updatePostInCaches = (updater) => {
		updatePostCaches(queryClient, post.id, updater);
	};

	const handlePostUpdated = (updatedPost) => {
		updatePostInCaches((cachedPost) => ({
			...cachedPost,
			text: updatedPost.text,
			updatedAt: updatedPost.updatedAt,
		}));
		queryClient.invalidateQueries({ queryKey: ["search", "posts"] });
	};

	const { mutate: deletePost, isPending: isDeleting } = useMutation({
		mutationFn: () => apiRequest(`/api/posts/${post.id}`, { method: "DELETE" }),
			onSuccess: () => {
			deleteDialogRef.current?.close();
			toast.success("Post deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			queryClient.invalidateQueries({ queryKey: ["search", "posts"] });
			queryClient.removeQueries({ queryKey: ["post", post.id] });
		},
		onError: (error) => toast.error(error.message),
	});

	const { mutate: likePost, isPending: isLiking } = useMutation({
		mutationFn: () => apiRequest(`/api/posts/like/${post.id}`, { method: "POST" }),
		onMutate: () => {
			const nextLikes = isLiked
				? likes.filter((like) => ownerId(like) !== authUser?.id)
				: [...likes, { userId: authUser?.id, postId: post.id }];
			updatePostInCaches((cachedPost) => ({ ...cachedPost, likes: nextLikes }));
			return { previousLikes: likes };
		},
		onError: (error, _variables, context) => {
			updatePostInCaches((cachedPost) => ({ ...cachedPost, likes: context?.previousLikes || [] }));
			toast.error(error.message);
		},
	});

	const { mutate: toggleBookmark, isPending: isBookmarking } = useMutation({
		mutationFn: () => apiRequest(`/api/posts/bookmark/${post.id}`, { method: "POST" }),
		onSuccess: ({ bookmarked }) => {
			updatePostInCaches((cachedPost) => ({ ...cachedPost, isBookmarked: bookmarked }));
			queryClient.invalidateQueries({ queryKey: ["posts", "bookmarks"] });
			toast.success(bookmarked ? "Post saved" : "Post removed from bookmarks");
		},
		onError: (error) => toast.error(error.message),
	});

	const { mutate: toggleRepost, isPending: isReposting } = useMutation({
		mutationFn: () => apiRequest(`/api/posts/repost/${post.id}`, { method: "POST" }),
		onSuccess: (updatedReposts) => {
			updatePostInCaches((cachedPost) => ({ ...cachedPost, reposts: updatedReposts }));
			queryClient.invalidateQueries({ queryKey: ["posts", "posts"] });
			const reposted = updatedReposts.includes(authUser?.id);
			toast.success(reposted ? "Post reposted" : "Repost removed");
		},
		onError: (error) => toast.error(error.message),
	});

	return (
		<article className='flex items-start gap-3 border-b border-gray-800 p-4 transition hover:bg-white/[0.02]'>
		<div className='avatar shrink-0'>
			<Link to={`/profile/${postOwner.username}`} className='block w-10 overflow-hidden rounded-full'>
				<img src={postOwner.profileImg || "/avatar-placeholder.png"} alt='' />
			</Link>
		</div>
		<div className='min-w-0 flex-1'>
			{post.repostedBy && (
				<div className='mb-1 flex items-center gap-1 text-xs font-semibold text-slate-500'>
					<BiRepost className='h-4 w-4' />
					{post.repostedBy.fullName || `@${post.repostedBy.username}`} reposted
				</div>
			)}
			<div className='flex items-center gap-2'>
				<Link to={`/profile/${postOwner.username}`} className='truncate font-bold hover:underline'>
					{postOwner.fullName || postOwner.username || "User"}
				</Link>
				<span className='flex min-w-0 gap-1 text-sm text-slate-500'>
					<span className='truncate'>@{postOwner.username || "user"}</span>
					<span>·</span>
					<span className='shrink-0'>{formatPostDate(post.createdAt)}</span>
					{wasEdited(post.createdAt, post.updatedAt) && <span className='shrink-0'>(edited)</span>}
				</span>
				{isMyPost && (
					<div className='ml-auto flex shrink-0 items-center'>
						<EditPostDialog post={post} onUpdated={handlePostUpdated} />
						<button
							type='button'
							className='rounded-full p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-500'
							onClick={() => deleteDialogRef.current?.showModal()}
							disabled={isDeleting}
							aria-label='Delete post'
						>
							<FaTrash className='h-4 w-4' />
						</button>
					</div>
				)}
			</div>

			<div className='mt-1 flex flex-col gap-3 overflow-hidden'>
				{post.text && <p className='whitespace-pre-wrap break-words'>{post.text}</p>}
				{post.img && <img src={post.img} className='max-h-[32rem] w-full rounded-2xl border border-gray-800 object-contain' alt='' />}
			</div>

			<div className='mt-3 flex items-center justify-between text-slate-500'>
				<CommentsDialog
					postId={post.id}
					commentCount={commentCount}
					authUserId={authUser?.id}
				/>

				<button
					type='button'
					className={`flex items-center gap-1 hover:text-green-500 ${reposts.some((repost) => ownerId(repost) === authUser?.id) ? "text-green-500" : ""}`}
					onClick={() => toggleRepost()}
					disabled={isReposting}
					aria-label='Toggle repost'
				>
					{isReposting ? <LoadingSpinner size='sm' /> : <BiRepost className='h-5 w-5' />}
					<span className='text-xs'>{reposts.length}</span>
				</button>

				<button
					type='button'
					className={`group flex items-center gap-1 hover:text-pink-500 ${isLiked ? "text-pink-500" : ""}`}
					onClick={() => likePost()}
					disabled={isLiking}
					aria-label={isLiked ? "Unlike post" : "Like post"}
				>
					<span className='rounded-full p-2 group-hover:bg-pink-500/10'>
						{isLiking ? <LoadingSpinner size='sm' /> : isLiked ? <FaHeart /> : <FaRegHeart />}
					</span>
					<span className='text-xs'>{likes.length}</span>
				</button>

				<button
					type='button'
					className={`rounded-full p-2 hover:bg-primary/10 hover:text-primary ${isBookmarked ? "text-primary" : ""}`}
					onClick={() => toggleBookmark()}
					disabled={isBookmarking}
					aria-label={isBookmarked ? "Remove bookmark" : "Save post"}
				>
					{isBookmarking ? <LoadingSpinner size='sm' /> : isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
				</button>
				</div>

				{isMyPost && (
					<dialog ref={deleteDialogRef} className='modal' aria-labelledby={`delete-post-title-${post.id}`}>
						<div className='modal-box max-w-sm rounded-2xl border border-gray-700 bg-black'>
							<h2 id={`delete-post-title-${post.id}`} className='text-xl font-bold'>Delete post?</h2>
							<p className='mt-2 text-sm leading-6 text-slate-400'>
								This cannot be undone. The post and its comments, likes, reposts, and bookmarks will be permanently removed.
							</p>
							<div className='modal-action mt-6'>
								<form method='dialog'>
									<button className='btn btn-ghost rounded-full' disabled={isDeleting}>Cancel</button>
								</form>
								<button
									type='button'
									className='btn rounded-full border-0 bg-red-600 text-white hover:bg-red-700'
									onClick={() => deletePost()}
									disabled={isDeleting}
								>
									{isDeleting ? <LoadingSpinner size='sm' /> : "Delete"}
								</button>
							</div>
						</div>
						<form method='dialog' className='modal-backdrop'>
							<button disabled={isDeleting}>Close</button>
						</form>
					</dialog>
				)}
		</div>
	</article>
	);
};

export default Post;
