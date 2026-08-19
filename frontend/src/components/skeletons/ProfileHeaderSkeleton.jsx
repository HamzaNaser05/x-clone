const ProfileHeaderSkeleton = () => (
	<div className='my-2 flex w-full flex-col gap-2 p-4'>
		<div className='skeleton h-4 w-24 rounded-full' />
		<div className='skeleton h-4 w-16 rounded-full' />
		<div className='skeleton relative h-48 w-full'>
			<div className='skeleton absolute -bottom-12 left-3 h-24 w-24 rounded-full border-4 border-black' />
		</div>
		<div className='skeleton ml-auto mt-4 h-8 w-24 rounded-full' />
		<div className='skeleton mt-4 h-4 w-32 rounded-full' />
		<div className='skeleton h-4 w-24 rounded-full' />
		<div className='skeleton h-4 w-2/3 rounded-full' />
	</div>
);

export default ProfileHeaderSkeleton;
