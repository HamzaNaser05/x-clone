import { BiRepost } from "react-icons/bi";
import { FaAt, FaHeart, FaRegComment, FaRegFileAlt, FaReply, FaUser } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import LoadingSpinner from "../../components/common/LoadingSpinner";
import { apiRequest } from "../../lib/api";
import { formatPostDate } from "../../utils/date";

const notificationDetails = {
	follow: {
		message: "followed you",
		icon: <FaUser className='mt-1 h-7 w-7 shrink-0 text-primary' />,
	},
	like: {
		message: "liked your post",
		icon: <FaHeart className='mt-1 h-7 w-7 shrink-0 text-pink-500' />,
	},
	comment: {
		message: "commented on your post",
		icon: <FaRegComment className='mt-1 h-7 w-7 shrink-0 text-sky-400' />,
	},
	reply: {
		message: "replied to your comment",
		icon: <FaReply className='mt-1 h-7 w-7 shrink-0 text-primary' />,
	},
	repost: {
		message: "reposted your post",
		icon: <BiRepost className='mt-1 h-7 w-7 shrink-0 text-green-500' />,
	},
	post: {
		message: "created a new post",
		icon: <FaRegFileAlt className='mt-1 h-7 w-7 shrink-0 text-primary' />,
	},
	mention: {
		message: "mentioned you",
		icon: <FaAt className='mt-1 h-7 w-7 shrink-0 text-primary' />,
	},
};

const getNotificationTarget = (notification) => {
	if (!notification.postId) return `/profile/${notification.from?.username}`;
	if (!notification.commentId) return `/post/${notification.postId}`;
	return `/post/${notification.postId}?comment=${notification.commentId}`;
};

const getNotificationMessage = (notification) => {
	if (notification.type === "mention") {
		return notification.commentId
			? "mentioned you in a comment"
			: "mentioned you in a post";
	}

	return notificationDetails[notification.type]?.message || "sent you a notification";
};

const NotificationPage = () => {
	const queryClient = useQueryClient();
	const { data: notifications = [], isLoading, isError, error } = useQuery({
		queryKey: ["notifications"],
		queryFn: async () => {
			const data = await apiRequest("/api/notifications");
			queryClient.setQueryData(["unreadNotifications"], { count: 0 });
			return data;
		},
	});

	const { mutate: deleteNotifications, isPending } = useMutation({
		mutationFn: () => apiRequest("/api/notifications", { method: "DELETE" }),
		onSuccess: () => {
			queryClient.setQueryData(["notifications"], []);
			queryClient.setQueryData(["unreadNotifications"], { count: 0 });
			toast.success("Notifications deleted successfully");
		},
		onError: (mutationError) => toast.error(mutationError.message),
	});

	return (
		<main className='min-h-screen min-w-0 flex-[4_4_0] border-r border-gray-800'>
			<header className='flex items-center justify-between border-b border-gray-800 p-4'>
				<h1 className='text-xl font-bold'>Notifications</h1>
				<div className='dropdown dropdown-end'>
					<button tabIndex={0} type='button' className='rounded-full p-2 hover:bg-secondary' aria-label='Notification settings'>
						<IoSettingsOutline className='h-5 w-5' />
					</button>
					<ul tabIndex={0} className='menu dropdown-content z-20 w-56 rounded-box border border-gray-800 bg-base-100 p-2 shadow-xl'>
						<li>
							<button type='button' onClick={() => deleteNotifications()} disabled={isPending || notifications.length === 0}>
								Delete all notifications
							</button>
						</li>
					</ul>
				</div>
			</header>

			{isLoading && <div className='grid min-h-72 place-items-center'><LoadingSpinner size='lg' /></div>}
			{isError && <p className='p-6 text-center text-red-400'>{error.message}</p>}
			{!isLoading && !isError && notifications.length === 0 && (
				<div className='px-6 py-14 text-center'>
					<p className='font-bold'>No notifications yet</p>
					<p className='mt-1 text-sm text-slate-500'>New posts, mentions, likes, comments, replies, reposts, and followers will appear here.</p>
				</div>
			)}
			{notifications.map((notification) => (
				<article className={`border-b border-gray-800 p-4 ${notification.read ? "" : "bg-primary/5"}`} key={notification.id}>
					<Link
						to={getNotificationTarget(notification)}
						className='flex items-start gap-3'
					>
						{notificationDetails[notification.type]?.icon}
						<div className='min-w-0'>
							<div className='avatar mb-1'>
								<div className='w-9 rounded-full'>
									<img src={notification.from?.profileImg || "/avatar-placeholder.png"} alt='' />
								</div>
							</div>
							<p>
								<span className='font-bold hover:underline'>@{notification.from?.username}</span>{" "}
								{getNotificationMessage(notification)}
							</p>
							<time className='text-xs text-slate-500' dateTime={notification.createdAt}>
								{formatPostDate(notification.createdAt)}
							</time>
						</div>
					</Link>
				</article>
			))}
		</main>
	);
};

export default NotificationPage;
