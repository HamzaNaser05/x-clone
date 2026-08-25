import { Link } from "react-router-dom";

const MENTION_PATTERN = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{1,50})\b/g;

const MentionText = ({ text }) => {
	if (typeof text !== "string" || !text) return null;

	const content = [];
	let currentIndex = 0;

	for (const match of text.matchAll(MENTION_PATTERN)) {
		const username = match[2];
		const mentionStart = match.index + match[1].length;
		const mentionEnd = mentionStart + username.length + 1;

		if (mentionStart > currentIndex) {
			content.push(text.slice(currentIndex, mentionStart));
		}

		content.push(
			<Link
				key={`${mentionStart}-${username}`}
				to={`/profile/${username}`}
				className='font-medium text-primary hover:underline'
				onClick={(event) => event.stopPropagation()}
			>
				@{username}
			</Link>
		);
		currentIndex = mentionEnd;
	}

	if (currentIndex < text.length) content.push(text.slice(currentIndex));
	return <>{content}</>;
};

export default MentionText;
