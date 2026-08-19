import { useState } from "react";

import Posts from "../../components/common/Posts";
import CreatePost from "./CreatePost";

const HomePage = () => {
	const [feedType, setFeedType] = useState("forYou");

	return (
		<main className='mr-auto min-h-screen min-w-0 flex-[4_4_0] border-r border-gray-800'>
			<div className='sticky top-0 z-10 flex w-full border-b border-gray-800 bg-black/80 backdrop-blur-md'>
				{[
					["forYou", "For you"],
					["following", "Following"],
				].map(([type, label]) => (
					<button
						type='button'
						className='relative flex flex-1 justify-center p-3 font-medium transition hover:bg-secondary'
						onClick={() => setFeedType(type)}
						key={type}
					>
						<span className={feedType === type ? "text-white" : "text-slate-500"}>{label}</span>
						{feedType === type && <span className='absolute bottom-0 h-1 w-14 rounded-full bg-primary' />}
					</button>
				))}
			</div>
			<CreatePost />
			<Posts feedType={feedType} />
		</main>
	);
};

export default HomePage;
