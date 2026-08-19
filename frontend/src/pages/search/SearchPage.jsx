import { useEffect, useState } from "react";
import { IoClose, IoSearchOutline } from "react-icons/io5";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import LoadingSpinner from "../../components/common/LoadingSpinner";
import Post from "../../components/common/Post";
import UserSearchResult from "../../components/common/UserSearchResult";
import PostSkeleton from "../../components/skeletons/PostSkeleton";
import { apiRequest } from "../../lib/api";

const MIN_SEARCH_LENGTH = 2;

const SearchInput = ({ query }) => {
	const [, setSearchParams] = useSearchParams();
	const [input, setInput] = useState(query);

	useEffect(() => {
		const nextQuery = input.trim();
		if (nextQuery === query) return undefined;

		const timeout = window.setTimeout(() => {
			setSearchParams((current) => {
				const next = new URLSearchParams(current);
				if (nextQuery) next.set("q", nextQuery);
				else next.delete("q");
				return next;
			}, { replace: true });
		}, 1000);

		return () => window.clearTimeout(timeout);
	}, [input, query, setSearchParams]);

	const submitSearch = (event) => {
		event.preventDefault();
		const nextQuery = input.trim();
		setSearchParams((current) => {
			const next = new URLSearchParams(current);
			if (nextQuery) next.set("q", nextQuery);
			else next.delete("q");
			return next;
		});
	};

	const clearSearch = () => {
		setInput("");
		setSearchParams((current) => {
			const next = new URLSearchParams(current);
			next.delete("q");
			return next;
		}, { replace: true });
	};

	return (
		<form className='relative' onSubmit={submitSearch} role='search'>
			<IoSearchOutline className='pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500' />
			<label className='sr-only' htmlFor='site-search'>Search users and posts</label>
			<input
				id='site-search'
				type='search'
				className='w-full rounded-full border border-transparent bg-secondary py-3 pl-12 pr-11 outline-none transition placeholder:text-slate-500 focus:border-primary focus:bg-black'
				placeholder='Search'
				value={input}
				onChange={(event) => setInput(event.target.value)}
				maxLength={100}
				autoFocus
			/>
			{input && (
				<button
					type='button'
					className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-primary p-1 text-black'
					onClick={clearSearch}
					aria-label='Clear search'
				>
					<IoClose className='h-4 w-4' />
				</button>
			)}
		</form>
	);
};

const SearchPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();
	const query = (searchParams.get("q") || "").trim();
	const activeTab = searchParams.get("type") === "posts" ? "posts" : "users";
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });
	const canSearch = query.length >= MIN_SEARCH_LENGTH;
	const {
		data,
		isLoading,
		isError,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ["search", activeTab, query],
		queryFn: ({ pageParam }) => {
			const params = new URLSearchParams({ q: query, limit: "10" });
			if (pageParam) params.set("cursor", pageParam);
			return apiRequest(`/api/search/${activeTab}?${params.toString()}`);
		},
		initialPageParam: null,
		getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
		enabled: canSearch,
	});
	const results = data?.pages.flatMap((page) => page[activeTab]) || [];

	const selectTab = (tab) => {
		setSearchParams((current) => {
			const next = new URLSearchParams(current);
			if (tab === "users") next.delete("type");
			else next.set("type", tab);
			return next;
		}, { replace: true });
	};

	return (
		<main className='min-h-screen min-w-0 flex-[4_4_0] border-r border-gray-800'>
			<header className='sticky top-0 z-10 border-b border-gray-800 bg-black/90 px-4 pb-3 pt-3 backdrop-blur-md'>
				<SearchInput key={query} query={query} />
			</header>
			<div className='flex border-b border-gray-800'>
				{[
					["users", "People"],
					["posts", "Posts"],
				].map(([tab, label]) => (
					<button
						type='button'
						className='relative flex flex-1 justify-center p-3 font-medium transition hover:bg-secondary'
						onClick={() => selectTab(tab)}
						key={tab}
					>
						<span className={activeTab === tab ? "text-white" : "text-slate-500"}>{label}</span>
						{activeTab === tab && <span className='absolute bottom-0 h-1 w-14 rounded-full bg-primary' />}
					</button>
				))}
			</div>

			{!query && (
				<div className='px-6 py-16 text-center'>
					<IoSearchOutline className='mx-auto h-10 w-10 text-slate-600' />
					<p className='mt-4 text-xl font-bold'>Search X Clone</p>
					<p className='mt-1 text-sm text-slate-500'>Find people by name or username, and posts by their text.</p>
				</div>
			)}
			{query && !canSearch && (
				<p className='px-6 py-14 text-center text-sm text-slate-500'>Enter at least 2 characters to search.</p>
			)}
			{canSearch && isLoading && (
				activeTab === "posts"
					? <><PostSkeleton /><PostSkeleton /><PostSkeleton /></>
					: <div className='grid min-h-52 place-items-center'><LoadingSpinner size='lg' /></div>
			)}
			{canSearch && isError && (
				<p className='px-6 py-14 text-center text-sm text-red-400'>{error.message}</p>
			)}
			{canSearch && !isLoading && !isError && results.length === 0 && (
				<div className='px-6 py-14 text-center'>
					<p className='font-bold'>No results for “{query}”</p>
					<p className='mt-1 text-sm text-slate-500'>Try another name, username, or phrase.</p>
				</div>
			)}
			{canSearch && !isLoading && !isError && activeTab === "users" && results.map((user) => (
				<UserSearchResult key={user.id} user={user} authUserId={authUser?.id} />
			))}
			{canSearch && !isLoading && !isError && activeTab === "posts" && results.map((post) => (
				<Post key={post.id} post={post} />
			))}
			{hasNextPage && (
				<div className='flex justify-center border-b border-gray-800 p-4'>
					<button
						type='button'
						className='btn btn-ghost btn-sm rounded-full text-primary'
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
					>
						{isFetchingNextPage ? "Loading..." : `Load more ${activeTab === "users" ? "people" : "posts"}`}
					</button>
				</div>
			)}
		</main>
	);
};

export default SearchPage;
