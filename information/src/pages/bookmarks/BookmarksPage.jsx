import Posts from "../../components/common/Posts";

const BookmarksPage = () => {
	return (
		<div className='flex-[4_4_0] border-r border-gray-700 min-h-screen'>
			<div className='p-4 border-b border-gray-700'>
				<h1 className='font-bold text-xl'>Bookmarks</h1>
				<p className='text-sm text-slate-500'>Posts you saved are private to you.</p>
			</div>
			<Posts feedType='bookmarks' />
		</div>
	);
};

export default BookmarksPage;
