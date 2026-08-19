import { BiLogOut } from "react-icons/bi";
import { FaBookmark, FaUser } from "react-icons/fa";
import { IoNotifications } from "react-icons/io5";
import { MdHomeFilled } from "react-icons/md";
import { NavLink } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import XSvg from "../svgs/X";
import { apiRequest } from "../../lib/api";
import useNotificationStream from "../../hooks/useNotificationStream";

const navClass = ({ isActive }) =>
	`flex max-w-fit items-center gap-3 rounded-full py-2 pl-2 pr-4 transition hover:bg-stone-900 ${isActive ? "font-bold" : ""
	}`;

const Sidebar = () => {
	const queryClient = useQueryClient();
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	useNotificationStream();
	const { data: unreadNotifications } = useQuery({
		queryKey: ["unreadNotifications"],
		queryFn: () => apiRequest("/api/notifications/unread-count"),
	});
	const unreadCount = unreadNotifications?.count || 0;

	const { mutate: logout, isPending } = useMutation({
		mutationFn: () => apiRequest("/api/auth/logout", { method: "POST" }),
		onSuccess: () => {
			queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "authUser" });
			queryClient.setQueryData(["authUser"], null);
		},
		onError: (error) => toast.error(error.message),
	});

	const navigation = [
		{ to: "/", label: "Home", icon: MdHomeFilled },
		{ to: "/notifications", label: "Notifications", icon: IoNotifications },
		{ to: "/bookmarks", label: "Bookmarks", icon: FaBookmark },
		{ to: `/profile/${authUser?.username}`, label: "Profile", icon: FaUser },
	];

	return (
		<aside className='w-18 max-w-52 md:flex-[2_2_0]'>
			<div className='sticky left-0 top-0 flex h-screen w-20 flex-col border-r border-gray-800 md:w-full'>
				<NavLink to='/' className='flex justify-center md:justify-start' aria-label='Home'>
					<XSvg className='h-12 w-12 rounded-full fill-white px-2 hover:bg-stone-900' />
				</NavLink>

				<nav aria-label='Primary navigation'>
					<ul className='mt-4 flex flex-col gap-3'>
						{navigation.map(({ to, label, icon: Icon }) => (
							<li className='flex justify-center md:justify-start' key={label}>
								<NavLink to={to} className={navClass} end={to === "/"}>
									<span className='relative shrink-0'>
										<Icon className={label === "Home" ? "h-8 w-8" : "h-6 w-6"} />
										{label === "Notifications" && unreadCount > 0 && (
											<span
												className='absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white ring-2 ring-black'
												aria-label={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
											>
												{unreadCount > 9 ? "9+" : unreadCount}
											</span>
										)}
									</span>
									<span className='hidden text-lg md:block'>{label}</span>
								</NavLink>
							</li>
						))}
					</ul>
				</nav>

				<div className='mb-6 mt-auto flex items-center justify-center gap-2 rounded-full px-2 py-2 hover:bg-[#181818] md:justify-start md:px-4'>
					<NavLink to={`/profile/${authUser?.username}`} className='hidden min-w-0 flex-1 items-center gap-2 md:flex'>
						<div className='avatar'>
							<div className='w-8 rounded-full'>
								<img src={authUser?.profileImg || "/avatar-placeholder.png"} alt='' />
							</div>
						</div>
						<div className='min-w-0'>
							<p className='truncate text-sm font-bold text-white'>{authUser?.fullName}</p>
							<p className='truncate text-sm text-slate-500'>@{authUser?.username}</p>
						</div>
					</NavLink>
					<button
						type='button'
						className='rounded-full p-2 hover:bg-stone-800 disabled:opacity-50'
						onClick={() => logout()}
						disabled={isPending}
						aria-label='Log out'
					>
						<BiLogOut className='h-5 w-5' />
					</button>
				</div>
			</div>
		</aside>
	);
};

export default Sidebar;
