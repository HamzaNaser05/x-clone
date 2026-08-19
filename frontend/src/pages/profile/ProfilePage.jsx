import { useRef, useState } from "react";
import { FaLink } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import { MdEdit } from "react-icons/md";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import EditProfileModal from "./EditProfileModal";
import Posts from "../../components/common/Posts";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import useFollow from "../../hooks/useFollow";
import useUpdateUserProfile from "../../hooks/useUpdateUserProfile";
import { apiRequest } from "../../lib/api";
import { formatMemberSinceDate } from "../../utils/date";

const ProfilePage = () => {
	const [coverImg, setCoverImg] = useState(null);
	const [profileImg, setProfileImg] = useState(null);
	const [feedType, setFeedType] = useState("posts");
	const coverImgRef = useRef(null);
	const profileImgRef = useRef(null);
	const { username } = useParams();

	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const { data: user, isLoading, isError, error } = useQuery({
		queryKey: ["userProfile", username],
		queryFn: () => apiRequest(`/api/users/profile/${encodeURIComponent(username)}`),
		enabled: Boolean(username),
	});
	const { follow, isPending: isFollowingUser, pendingUserId } = useFollow();
	const { updateProfile, isUpdatingProfile } = useUpdateUserProfile();

	const isMyProfile = authUser?.id === user?.id;
	const isFollowing = Boolean(user?.isFollowing);

	const handleImageChange = (event, imageType) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			if (imageType === "coverImg") setCoverImg(reader.result);
			if (imageType === "profileImg") setProfileImg(reader.result);
		};
		reader.readAsDataURL(file);
	};

	const saveImages = async () => {
		await updateProfile({ coverImg, profileImg });
		setCoverImg(null);
		setProfileImg(null);
	};

	const toggleFollow = () => {
		follow(user.id);
	};

	const externalLink = user?.link
		? user.link.startsWith("http://") || user.link.startsWith("https://")
			? user.link
			: `https://${user.link}`
		: null;

	return (
		<main className='min-h-screen min-w-0 flex-[4_4_0] border-r border-gray-800'>
			{isLoading && <ProfileHeaderSkeleton />}
			{isError && (
				<div className='p-8 text-center'>
					<p className='font-bold'>Unable to load this profile</p>
					<p className='mt-1 text-sm text-red-400'>{error.message}</p>
				</div>
			)}

			{user && (
				<>
					<header className='flex items-center gap-8 px-4 py-2'>
						<Link to='/' className='rounded-full p-2 hover:bg-secondary' aria-label='Back to home'>
							<FaArrowLeft className='h-4 w-4' />
						</Link>
						<div>
							<h1 className='text-lg font-bold'>{user.fullName}</h1>
							<p className='text-xs text-slate-500'>Profile</p>
						</div>
					</header>

					<div className='group/cover relative'>
						<img src={coverImg || user.coverImg || "/cover.png"} className='h-48 w-full object-cover sm:h-52' alt='Profile cover' />
						{isMyProfile && (
							<button
								type='button'
								className='absolute right-3 top-3 rounded-full bg-black/60 p-2 opacity-0 backdrop-blur transition group-hover/cover:opacity-100 focus:opacity-100'
								onClick={() => coverImgRef.current?.click()}
								aria-label='Change cover image'
							>
								<MdEdit className='h-5 w-5' />
							</button>
						)}
						<input type='file' hidden accept='image/*' ref={coverImgRef} onChange={(event) => handleImageChange(event, "coverImg")} />
						<input type='file' hidden accept='image/*' ref={profileImgRef} onChange={(event) => handleImageChange(event, "profileImg")} />

						<div className='avatar absolute -bottom-16 left-4'>
							<div className='group/avatar relative w-32 rounded-full border-4 border-black bg-black'>
								<img src={profileImg || user.profileImg || "/avatar-placeholder.png"} alt={`${user.username}'s avatar`} />
								{isMyProfile && (
									<button
										type='button'
										className='absolute inset-0 grid place-items-center rounded-full bg-black/50 opacity-0 transition group-hover/avatar:opacity-100 focus:opacity-100'
										onClick={() => profileImgRef.current?.click()}
										aria-label='Change profile image'
									>
										<MdEdit className='h-5 w-5' />
									</button>
								)}
							</div>
						</div>
					</div>

					<div className='flex min-h-20 items-start justify-end gap-2 px-4 pt-3'>
						{isMyProfile ? (
							<EditProfileModal authUser={authUser} />
						) : (
							<button
								type='button'
								className='btn btn-outline btn-sm rounded-full'
								onClick={toggleFollow}
								disabled={isFollowingUser}
							>
								{isFollowingUser && pendingUserId === user.id
									? <LoadingSpinner size='sm' />
									: isFollowing
										? "Unfollow"
										: "Follow"}
							</button>
						)}
						{isMyProfile && (coverImg || profileImg) && (
							<button type='button' className='btn btn-primary btn-sm rounded-full text-white' onClick={saveImages} disabled={isUpdatingProfile}>
								{isUpdatingProfile ? <LoadingSpinner size='sm' /> : "Save images"}
							</button>
						)}
					</div>

					<section className='flex flex-col gap-4 px-4 pb-4'>
						<div>
							<h2 className='text-lg font-bold'>{user.fullName}</h2>
							<p className='text-sm text-slate-500'>@{user.username}</p>
							{user.bio && <p className='mt-3 whitespace-pre-wrap text-sm'>{user.bio}</p>}
						</div>
						<div className='flex flex-wrap gap-3 text-sm'>
							{externalLink && (
								<span className='flex items-center gap-1'>
									<FaLink className='text-slate-500' />
									<a href={externalLink} target='_blank' rel='noreferrer' className='max-w-52 truncate text-primary hover:underline'>{user.link}</a>
								</span>
							)}
							<span className='flex items-center gap-1 text-slate-500'>
								<IoCalendarOutline className='h-4 w-4' />
								{formatMemberSinceDate(user.createdAt)}
							</span>
						</div>
						<div className='flex gap-4 text-xs text-slate-500'>
							<span><strong className='text-white'>{(user.followingCount || 0).toLocaleString()}</strong> Following</span>
							<span><strong className='text-white'>{(user.followersCount || 0).toLocaleString()}</strong> Followers</span>
						</div>
					</section>

					<div className='flex w-full border-b border-gray-800'>
						<button type='button' className='relative flex flex-1 justify-center p-3 hover:bg-secondary' onClick={() => setFeedType("posts")}>
							Posts
							{feedType === "posts" && <span className='absolute bottom-0 h-1 w-12 rounded-full bg-primary' />}
						</button>
						{isMyProfile && (
							<button type='button' className='relative flex flex-1 justify-center p-3 hover:bg-secondary' onClick={() => setFeedType("likes")}>
								Likes
								{feedType === "likes" && <span className='absolute bottom-0 h-1 w-12 rounded-full bg-primary' />}
							</button>
						)}
					</div>
					<Posts feedType={feedType} username={username} profileUser={user} />
				</>
			)}
		</main>
	);
};

export default ProfilePage;
