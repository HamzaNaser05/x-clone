import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import useFollow from "../../hooks/useFollow";
import { apiRequest } from "../../lib/api";
import LoadingSpinner from "./LoadingSpinner";
import RightPanelSkeleton from "../skeletons/RightPanelSkeleton";

const RightPanel = () => {
	const { data: suggestedUsers = [], isLoading } = useQuery({
		queryKey: ["suggestedUsers"],
		queryFn: () => apiRequest("/api/users/suggested"),
	});
	const { follow, isPending, pendingUserId } = useFollow();

	return (
		<aside className='mx-3 my-4 hidden w-72 shrink-0 lg:block'>
			<div className='sticky top-3 rounded-2xl bg-[#16181c] p-4'>
				<h2 className='text-xl font-bold'>Who to follow</h2>
				<div className='mt-4 flex flex-col gap-4'>
					{isLoading && Array.from({ length: 4 }, (_, index) => <RightPanelSkeleton key={index} />)}
					{!isLoading && suggestedUsers.length === 0 && (
						<p className='text-sm text-slate-500'>You are all caught up.</p>
					)}
					{suggestedUsers.map((user) => (
						<div className='flex items-center justify-between gap-3' key={user.id}>
							<Link to={`/profile/${user.username}`} className='flex min-w-0 items-center gap-2'>
								<div className='avatar'>
									<div className='w-9 rounded-full'>
										<img src={user.profileImg || "/avatar-placeholder.png"} alt='' />
									</div>
								</div>
								<div className='min-w-0'>
									<p className='truncate text-sm font-semibold'>{user.fullName}</p>
									<p className='truncate text-sm text-slate-500'>@{user.username}</p>
								</div>
							</Link>
							<button
								type='button'
								className='btn btn-sm shrink-0 rounded-full border-0 bg-white text-black hover:bg-gray-200'
								onClick={() => follow(user.id)}
								disabled={isPending}
							>
								{isPending && pendingUserId === user.id ? <LoadingSpinner size='sm' /> : "Follow"}
							</button>
						</div>
					))}
				</div>
			</div>
		</aside>
	);
};

export default RightPanel;
