import Posts from "../../components/common/Posts";

const BookmarksPage = () => (
	<main className='min-h-screen min-w-0 flex-[4_4_0] border-r border-gray-800'>
		<header className='border-b border-gray-800 p-4'>
			<h1 className='text-xl font-bold'>Bookmarks</h1>
			<p className='text-sm text-slate-500'>Posts you save are private to you.</p>
		</header>
		<Posts feedType='bookmarks' />
	</main>
);

export default BookmarksPage;
