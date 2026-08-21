import { useEffect, useRef, useState } from "react";
import { FaComment, FaRegHeart, FaRetweet, FaTrash, FaUsers } from "react-icons/fa";
import { IoClose, IoNotifications, IoSearchOutline } from "react-icons/io5";
import { MdAdminPanelSettings, MdArticle, MdOutlineForum } from "react-icons/md";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import AdminBadge from "../../components/common/AdminBadge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { apiRequest } from "../../lib/api";
import { formatMemberSinceDate, formatPostDate } from "../../utils/date";

const tabs = [
	["overview", "Overview"],
	["users", "Users"],
	["posts", "Posts"],
	["comments", "Comments"],
];

const AdminSearch = ({ query, resource, onSearch }) => {
	const [value, setValue] = useState(query);

	const submit = (event) => {
		event.preventDefault();
		onSearch(value.trim());
	};

	const clear = () => {
		setValue("");
		onSearch("");
	};

	return (
		<form className='relative border-b border-gray-800 p-4' onSubmit={submit} role='search'>
			<IoSearchOutline className='pointer-events-none absolute left-8 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500' />
			<label className='sr-only' htmlFor={`admin-${resource}-search`}>Search {resource}</label>
			<input
				id={`admin-${resource}-search`}
				type='search'
				className='w-full rounded-full border border-gray-800 bg-secondary py-3 pl-12 pr-20 outline-none transition focus:border-primary'
				placeholder={`Search ${resource}`}
				value={value}
				onChange={(event) => setValue(event.target.value)}
				maxLength={100}
			/>
			{value && (
				<button
					type='button'
					className='absolute right-20 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 hover:text-white'
					onClick={clear}
					aria-label='Clear admin search'
				>
					<IoClose className='h-4 w-4' />
				</button>
			)}
			<button type='submit' className='btn btn-primary btn-sm absolute right-6 top-1/2 -translate-y-1/2 rounded-full text-white'>
				Search
			</button>
		</form>
	);
};

const AdminOverview = () => {
	const { data: stats, isLoading, isError, error } = useQuery({
		queryKey: ["admin", "stats"],
		queryFn: () => apiRequest("/api/admin/stats"),
	});

	if (isLoading) return <div className='grid min-h-64 place-items-center'><LoadingSpinner size='lg' /></div>;
	if (isError) return <p className='p-8 text-center text-sm text-red-400'>{error.message}</p>;

	const cards = [
		["Users", stats.users, FaUsers, "text-blue-400", "bg-blue-500/10"],
		["Posts", stats.posts, MdArticle, "text-emerald-400", "bg-emerald-500/10"],
		["Comments", stats.comments, FaComment, "text-amber-400", "bg-amber-500/10"],
		["Notifications", stats.notifications, IoNotifications, "text-fuchsia-400", "bg-fuchsia-500/10"],
	];

	return (
		<section className='p-4 sm:p-6'>
			<div className='grid gap-3 sm:grid-cols-2'>
				{cards.map(([label, count, Icon, textColor, background]) => (
					<div className='rounded-2xl border border-gray-800 bg-[#080808] p-5' key={label}>
						<div className={`grid h-10 w-10 place-items-center rounded-full ${background}`}>
							<Icon className={`h-5 w-5 ${textColor}`} />
						</div>
						<p className='mt-5 text-3xl font-black'>{Number(count || 0).toLocaleString()}</p>
						<p className='mt-1 text-sm text-slate-500'>{label}</p>
					</div>
				))}
			</div>
			<div className='mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-5'>
				<h2 className='font-bold text-primary'>Moderation workspace</h2>
				<p className='mt-2 text-sm leading-6 text-slate-400'>
					Review users and remove inappropriate posts or comments. Every destructive action asks for confirmation first.
				</p>
			</div>
		</section>
	);
};

const AdminUserRow = ({ user }) => (
	<article className='flex items-start gap-3 border-b border-gray-800 p-4'>
		<Link to={`/profile/${user.username}`} className='avatar shrink-0'>
			<div className='w-11 rounded-full'>
				<img src={user.profileImg || "/avatar-placeholder.png"} alt='' />
			</div>
		</Link>
		<div className='min-w-0 flex-1'>
			<div className='flex flex-wrap items-center gap-1.5'>
				<Link to={`/profile/${user.username}`} className='truncate font-bold hover:underline'>{user.fullName}</Link>
				{user.role === "ADMIN" && <AdminBadge />}
			</div>
			<p className='truncate text-sm text-slate-500'>@{user.username} · {user.email}</p>
			<p className='mt-2 text-xs text-slate-500'>{formatMemberSinceDate(user.createdAt)}</p>
			<div className='mt-2 flex flex-wrap gap-4 text-xs text-slate-400'>
				<span><strong className='text-white'>{user._count.posts}</strong> posts</span>
				<span><strong className='text-white'>{user._count.comments}</strong> comments</span>
				<span><strong className='text-white'>{user._count.followers}</strong> followers</span>
			</div>
		</div>
	</article>
);

const AdminPostRow = ({ post, onDelete }) => (
	<article className='border-b border-gray-800 p-4'>
		<div className='flex items-start gap-3'>
			<Link to={`/profile/${post.author.username}`} className='avatar shrink-0'>
				<div className='w-9 rounded-full'>
					<img src={post.author.profileImg || "/avatar-placeholder.png"} alt='' />
				</div>
			</Link>
			<div className='min-w-0 flex-1'>
				<div className='flex flex-wrap items-center gap-1.5 text-sm'>
					<Link to={`/profile/${post.author.username}`} className='font-bold hover:underline'>{post.author.fullName}</Link>
					{post.author.role === "ADMIN" && <AdminBadge />}
					<span className='text-slate-500'>@{post.author.username} · {formatPostDate(post.createdAt)}</span>
				</div>
				{post.text && <p className='mt-2 whitespace-pre-wrap break-words text-sm'>{post.text}</p>}
				{post.img && <img src={post.img} className='mt-3 h-28 w-40 rounded-xl border border-gray-800 object-cover' alt='Post attachment' />}
				<div className='mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500'>
					<span className='flex items-center gap-1'><FaComment /> {post._count.comments}</span>
					<span className='flex items-center gap-1'><FaRegHeart /> {post._count.likes}</span>
					<span className='flex items-center gap-1'><FaRetweet /> {post._count.reposts}</span>
					<Link to={`/post/${post.id}`} className='text-primary hover:underline'>Open post</Link>
				</div>
			</div>
			<button
				type='button'
				className='shrink-0 rounded-full p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-500'
				onClick={() => onDelete({ id: post.id, type: "posts", label: "post" })}
				aria-label='Remove post as administrator'
			>
				<FaTrash className='h-4 w-4' />
			</button>
		</div>
	</article>
);

const AdminCommentRow = ({ comment, onDelete }) => (
	<article className='border-b border-gray-800 p-4'>
		<div className='flex items-start gap-3'>
			<Link to={`/profile/${comment.user.username}`} className='avatar shrink-0'>
				<div className='w-9 rounded-full'>
					<img src={comment.user.profileImg || "/avatar-placeholder.png"} alt='' />
				</div>
			</Link>
			<div className='min-w-0 flex-1'>
				<div className='flex flex-wrap items-center gap-1.5 text-sm'>
					<Link to={`/profile/${comment.user.username}`} className='font-bold hover:underline'>{comment.user.fullName}</Link>
					{comment.user.role === "ADMIN" && <AdminBadge />}
					<span className='text-slate-500'>@{comment.user.username} · {formatPostDate(comment.createdAt)}</span>
				</div>
				<p className='mt-2 whitespace-pre-wrap break-words text-sm'>{comment.text}</p>
				<div className='mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500'>
					<span className='rounded-full bg-secondary px-2 py-1'>{comment.parentId ? "Reply" : "Comment"}</span>
					{comment._count.replies > 0 && <span>{comment._count.replies} replies</span>}
					<Link to={`/post/${comment.post.id}`} className='text-primary hover:underline'>View conversation</Link>
				</div>
			</div>
			<button
				type='button'
				className='shrink-0 rounded-full p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-500'
				onClick={() => onDelete({ id: comment.id, type: "comments", label: comment.parentId ? "reply" : "comment" })}
				aria-label={`Remove ${comment.parentId ? "reply" : "comment"} as administrator`}
			>
				<FaTrash className='h-4 w-4' />
			</button>
		</div>
	</article>
);

const DeleteConfirmation = ({ target, isPending, onCancel, onConfirm }) => {
	const dialogRef = useRef(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (target && !dialog?.open) dialog?.showModal();
		if (!target && dialog?.open) dialog.close();
	}, [target]);

	return (
		<dialog ref={dialogRef} className='modal' onClose={onCancel} aria-labelledby='admin-delete-title'>
			<div className='modal-box max-w-sm rounded-2xl border border-gray-700 bg-black'>
				<h2 id='admin-delete-title' className='text-xl font-bold'>Remove this {target?.label}?</h2>
				<p className='mt-2 text-sm leading-6 text-slate-400'>
					This administrator action is permanent and cannot be undone.
				</p>
				<div className='modal-action mt-6'>
					<button type='button' className='btn btn-ghost rounded-full' onClick={onCancel} disabled={isPending}>Cancel</button>
					<button
						type='button'
						className='btn rounded-full border-0 bg-red-600 text-white hover:bg-red-700'
						onClick={onConfirm}
						disabled={isPending}
					>
						{isPending ? <LoadingSpinner size='sm' /> : "Remove"}
					</button>
				</div>
			</div>
			<form method='dialog' className='modal-backdrop'><button disabled={isPending}>Close</button></form>
		</dialog>
	);
};

const AdminResourceList = ({ resource, query }) => {
	const [deletionTarget, setDeletionTarget] = useState(null);
	const queryClient = useQueryClient();
	const {
		data,
		isLoading,
		isError,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ["admin", resource, query],
		queryFn: ({ pageParam }) => {
			const params = new URLSearchParams({ limit: "10" });
			if (query) params.set("q", query);
			if (pageParam) params.set("cursor", pageParam);
			return apiRequest(`/api/admin/${resource}?${params.toString()}`);
		},
		initialPageParam: null,
		getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
	});
	const items = data?.pages.flatMap((page) => page[resource]) || [];

	const { mutate: removeResource, isPending: isDeleting } = useMutation({
		mutationFn: (target) => apiRequest(`/api/admin/${target.type}/${target.id}`, { method: "DELETE" }),
		onSuccess: (result, target) => {
			setDeletionTarget(null);
			toast.success(result.message);
			queryClient.invalidateQueries({ queryKey: ["admin"] });
			queryClient.invalidateQueries({ queryKey: ["posts"] });
			queryClient.invalidateQueries({ queryKey: ["comments"] });
			queryClient.invalidateQueries({ queryKey: ["replies"] });
			queryClient.invalidateQueries({ queryKey: ["search", "posts"] });
			if (target.type === "posts") queryClient.removeQueries({ queryKey: ["post", target.id] });
		},
		onError: (error) => toast.error(error.message),
	});

	if (isLoading) return <div className='grid min-h-64 place-items-center'><LoadingSpinner size='lg' /></div>;
	if (isError) return <p className='p-8 text-center text-sm text-red-400'>{error.message}</p>;

	return (
		<>
			{items.length === 0 && (
				<div className='px-6 py-16 text-center'>
					<MdOutlineForum className='mx-auto h-10 w-10 text-slate-600' />
					<p className='mt-3 font-bold'>No {resource} found</p>
					{query && <p className='mt-1 text-sm text-slate-500'>Try a different search.</p>}
				</div>
			)}
			{resource === "users" && items.map((user) => <AdminUserRow key={user.id} user={user} />)}
			{resource === "posts" && items.map((post) => <AdminPostRow key={post.id} post={post} onDelete={setDeletionTarget} />)}
			{resource === "comments" && items.map((comment) => <AdminCommentRow key={comment.id} comment={comment} onDelete={setDeletionTarget} />)}
			{hasNextPage && (
				<div className='flex justify-center p-4'>
					<button type='button' className='btn btn-ghost btn-sm rounded-full text-primary' onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
						{isFetchingNextPage ? "Loading..." : `Load more ${resource}`}
					</button>
				</div>
			)}
			<DeleteConfirmation
				target={deletionTarget}
				isPending={isDeleting}
				onCancel={() => !isDeleting && setDeletionTarget(null)}
				onConfirm={() => deletionTarget && removeResource(deletionTarget)}
			/>
		</>
	);
};

const AdminPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const requestedTab = searchParams.get("tab");
	const activeTab = tabs.some(([tab]) => tab === requestedTab) ? requestedTab : "overview";
	const query = (searchParams.get("q") || "").trim();

	const selectTab = (tab) => {
		setSearchParams((current) => {
			const next = new URLSearchParams(current);
			if (tab === "overview") next.delete("tab");
			else next.set("tab", tab);
			next.delete("q");
			return next;
		});
	};

	const search = (value) => {
		setSearchParams((current) => {
			const next = new URLSearchParams(current);
			if (value) next.set("q", value);
			else next.delete("q");
			return next;
		});
	};

	return (
		<main className='min-h-screen min-w-0 flex-[8_8_0] border-r border-gray-800'>
			<header className='sticky top-0 z-10 border-b border-gray-800 bg-black/90 px-4 py-3 backdrop-blur-md'>
				<div className='flex items-center gap-3'>
					<div className='grid h-10 w-10 place-items-center rounded-full bg-primary/10'>
						<MdAdminPanelSettings className='h-6 w-6 text-primary' />
					</div>
					<div>
						<h1 className='text-xl font-bold'>Admin dashboard</h1>
						<p className='text-xs text-slate-500'>Review activity and moderate content</p>
					</div>
				</div>
			</header>
			<nav className='flex overflow-x-auto border-b border-gray-800' aria-label='Admin sections'>
				{tabs.map(([tab, label]) => (
					<button
						type='button'
						className='relative min-w-24 flex-1 px-4 py-3 text-sm font-medium transition hover:bg-secondary'
						onClick={() => selectTab(tab)}
						key={tab}
					>
						<span className={activeTab === tab ? "text-white" : "text-slate-500"}>{label}</span>
						{activeTab === tab && <span className='absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-primary' />}
					</button>
				))}
			</nav>
			{activeTab === "overview" ? (
				<AdminOverview />
			) : (
				<>
					<AdminSearch key={`${activeTab}-${query}`} query={query} resource={activeTab} onSearch={search} />
					<AdminResourceList resource={activeTab} query={query} />
				</>
			)}
		</main>
	);
};

export default AdminPage;
