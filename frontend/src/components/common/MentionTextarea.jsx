import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "../../lib/api";
import { getActiveMention, insertSelectedMention } from "../../utils/mentions";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DELAY_MS = 250;

const MentionTextarea = ({
	value,
	onValueChange,
	className = "",
	wrapperClassName = "",
	menuPlacement = "bottom",
	...textareaProps
}) => {
	const textareaRef = useRef(null);
	const listboxId = useId();
	const [caretPosition, setCaretPosition] = useState(value.length);
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [dismissedMention, setDismissedMention] = useState("");
	const activeMention = useMemo(
		() => getActiveMention(value, caretPosition),
		[value, caretPosition]
	);
	const activeQuery = activeMention?.query || "";
	const activeMentionKey = activeMention
		? `${activeMention.start}:${activeMention.query}`
		: "";

	useEffect(() => {
		if (activeQuery.length < MIN_QUERY_LENGTH) return undefined;

		const timeout = window.setTimeout(() => {
			setDebouncedQuery(activeQuery);
		}, SEARCH_DELAY_MS);

		return () => window.clearTimeout(timeout);
	}, [activeQuery]);

	const {
		data,
		isFetching,
		isError,
	} = useQuery({
		queryKey: ["mentionSuggestions", debouncedQuery.toLowerCase()],
		queryFn: () => {
			const params = new URLSearchParams({ q: debouncedQuery, limit: "5" });
			return apiRequest(`/api/search/users?${params.toString()}`);
		},
		enabled: debouncedQuery.length >= MIN_QUERY_LENGTH,
		staleTime: 30_000,
	});
	const suggestions = debouncedQuery === activeQuery
		? (data?.users || [])
		: [];
	const safeSelectedIndex = suggestions.length > 0
		? Math.min(selectedIndex, suggestions.length - 1)
		: 0;
	const isMenuOpen = isFocused
		&& Boolean(activeMention)
		&& dismissedMention !== activeMentionKey;
	const isWaitingForSearch = activeQuery.length >= MIN_QUERY_LENGTH
		&& (debouncedQuery !== activeQuery || isFetching);
	const isCurrentSearch = activeQuery.length >= MIN_QUERY_LENGTH
		&& debouncedQuery === activeQuery;

	const updateCaretPosition = (event) => {
		setCaretPosition(event.currentTarget.selectionStart);
		setSelectedIndex(0);
		setDismissedMention("");
	};

	const handleChange = (event) => {
		onValueChange(event.target.value);
		updateCaretPosition(event);
	};

	const insertMention = (user) => {
		if (!activeMention) return;

		const insertion = insertSelectedMention(value, activeMention, user.username);
		if (!insertion) return;
		const { value: nextValue, caretPosition: nextCaretPosition } = insertion;

		onValueChange(nextValue);
		setCaretPosition(nextCaretPosition);
		setSelectedIndex(0);
		setDismissedMention("");

		window.requestAnimationFrame(() => {
			textareaRef.current?.focus();
			textareaRef.current?.setSelectionRange(nextCaretPosition, nextCaretPosition);
			setCaretPosition(nextCaretPosition);
		});
	};

	const handleKeyDown = (event) => {
		if (!isMenuOpen) return;

		if (event.key === "Escape") {
			event.preventDefault();
			setDismissedMention(activeMentionKey);
			return;
		}
		if (suggestions.length === 0) return;

		if (event.key === "ArrowDown") {
			event.preventDefault();
			setSelectedIndex((current) => (current + 1) % suggestions.length);
		} else if (event.key === "ArrowUp") {
			event.preventDefault();
			setSelectedIndex((current) => (
				current <= 0 ? suggestions.length - 1 : current - 1
			));
		} else if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			insertMention(suggestions[safeSelectedIndex]);
		}
	};

	return (
		<div
			className={`relative ${wrapperClassName}`}
			onFocus={() => setIsFocused(true)}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
			}}
		>
			<textarea
				{...textareaProps}
				ref={textareaRef}
				className={className}
				value={value}
				onChange={handleChange}
				onClick={updateCaretPosition}
				onSelect={updateCaretPosition}
				onFocus={(event) => {
					setIsFocused(true);
					updateCaretPosition(event);
				}}
				onKeyDown={handleKeyDown}
				role='combobox'
				aria-autocomplete='list'
				aria-expanded={isMenuOpen}
				aria-controls={isMenuOpen ? listboxId : undefined}
				aria-activedescendant={isMenuOpen && suggestions.length > 0
					? `${listboxId}-option-${safeSelectedIndex}`
					: undefined}
			/>

			{isMenuOpen && (
				<div
					id={listboxId}
					role='listbox'
					className={`absolute z-40 max-h-64 w-full min-w-64 overflow-y-auto rounded-xl border border-gray-700 bg-black p-1 shadow-2xl ${
						menuPlacement === "top" ? "bottom-full mb-2" : "top-full mt-2"
					}`}
				>
					{activeQuery.length < MIN_QUERY_LENGTH && (
						<p className='px-3 py-2 text-sm text-slate-400'>Type at least 2 characters after @</p>
					)}
					{isWaitingForSearch && (
						<p className='px-3 py-2 text-sm text-slate-400'>Searching users…</p>
					)}
					{!isWaitingForSearch && isCurrentSearch && isError && (
						<p className='px-3 py-2 text-sm text-red-400'>Unable to search users</p>
					)}
					{!isWaitingForSearch
						&& isCurrentSearch
						&& !isError
						&& suggestions.length === 0 && (
							<p className='px-3 py-2 text-sm text-slate-400'>No users found for @{activeQuery}</p>
						)}
					{!isWaitingForSearch && suggestions.map((user, index) => (
						<button
							key={user.id}
							id={`${listboxId}-option-${index}`}
							type='button'
							role='option'
							aria-selected={index === safeSelectedIndex}
							className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
								index === safeSelectedIndex ? "bg-secondary" : "hover:bg-secondary"
							}`}
							onMouseDown={(event) => event.preventDefault()}
							onMouseEnter={() => setSelectedIndex(index)}
							onClick={() => insertMention(user)}
						>
							<img
								src={user.profileImg || "/avatar-placeholder.png"}
								alt=''
								className='h-9 w-9 rounded-full object-cover'
							/>
							<span className='min-w-0'>
								<span className='block truncate text-sm font-semibold text-white'>{user.fullName}</span>
								<span className='flex items-center gap-2 text-xs text-slate-400'>
									<span className='truncate'>@{user.username}</span>
									{user.username.toLowerCase() === activeQuery.toLowerCase() && (
										<span className='shrink-0 text-emerald-400'>✓ Exact match</span>
									)}
								</span>
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default MentionTextarea;
