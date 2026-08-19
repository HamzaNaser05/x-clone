const PostSkeleton = () => (
	<div className='flex w-full flex-col gap-4 border-b border-gray-800 p-4'>
		<div className='flex items-center gap-4'>
			<div className='skeleton h-10 w-10 shrink-0 rounded-full' />
			<div className='flex flex-col gap-2'>
				<div className='skeleton h-2 w-20 rounded-full' />
				<div className='skeleton h-2 w-32 rounded-full' />
			</div>
		</div>
		<div className='skeleton h-40 w-full rounded-xl' />
	</div>
);

export default PostSkeleton;
