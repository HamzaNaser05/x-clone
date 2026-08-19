const RightPanelSkeleton = () => (
	<div className='my-2 flex w-52 items-center gap-2'>
		<div className='skeleton h-8 w-8 shrink-0 rounded-full' />
		<div className='flex flex-1 justify-between'>
			<div className='flex flex-col gap-1'>
				<div className='skeleton h-2 w-16 rounded-full' />
				<div className='skeleton h-2 w-20 rounded-full' />
			</div>
			<div className='skeleton h-7 w-16 rounded-full' />
		</div>
	</div>
);

export default RightPanelSkeleton;
