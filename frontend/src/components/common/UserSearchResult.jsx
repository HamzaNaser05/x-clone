import { Link } from "react-router-dom";

import useFollow from "../../hooks/useFollow";
import LoadingSpinner from "./LoadingSpinner";

const UserSearchResult = ({ user, authUserId }) => {
	const { follow, isPending, pendingUserId } = useFollow();
	const isCurrentUser = user.id === authUserId;

	return (
		<article className='flex items-start gap-3 border-b border-gray-800 p-4 transition hover:bg-white/[0.02]'>
			<Link to={`/profile/${user.username}`} className='avatar shrink-0'>
				<div className='w-11 rounded-full'>
					<img src={user.profileImg || "/avatar-placeholder.png"} alt='' />
				</div>
			</Link>
			<div className='min-w-0 flex-1'>
				<div className='flex items-start justify-between gap-3'>
					<Link to={`/profile/${user.username}`} className='min-w-0'>
						<p className='truncate font-bold hover:underline'>{user.fullName}</p>
						<p className='truncate text-sm text-slate-500'>@{user.username}</p>
					</Link>
					{!isCurrentUser && (
						<button
							type='button'
							className={`btn btn-sm shrink-0 rounded-full ${user.isFollowing
								? "btn-outline border-gray-600 text-white hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
								: "border-0 bg-white text-black hover:bg-gray-200"
							}`}
							onClick={() => follow(user.id)}
							disabled={isPending}
						>
							{isPending && pendingUserId === user.id
								? <LoadingSpinner size='sm' />
								: user.isFollowing ? "Unfollow" : "Follow"}
						</button>
					)}
				</div>
				{user.bio && <p className='mt-2 whitespace-pre-wrap text-sm'>{user.bio}</p>}
				<p className='mt-2 text-xs text-slate-500'>
					{user.followersCount} follower{user.followersCount === 1 ? "" : "s"}
				</p>
			</div>
		</article>
	);
};

export default UserSearchResult;
