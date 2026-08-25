export const getActiveMention = (text, caretPosition) => {
	if (typeof text !== "string" || !Number.isInteger(caretPosition)) return null;

	const textBeforeCaret = text.slice(0, caretPosition);
	const match = textBeforeCaret.match(/(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{0,50})$/);
	if (!match) return null;

	return {
		query: match[2],
		start: caretPosition - match[2].length - 1,
		end: caretPosition,
	};
};

export const insertSelectedMention = (text, activeMention, username) => {
	if (!activeMention || typeof username !== "string") return null;

	const textAfterMention = text.slice(activeMention.end);
	const needsSeparator = textAfterMention === ""
		|| !/^[\s.,!?;:)\]}]/.test(textAfterMention);
	const mention = `@${username}${needsSeparator ? " " : ""}`;
	return {
		value: `${text.slice(0, activeMention.start)}${mention}${textAfterMention}`,
		caretPosition: activeMention.start + mention.length,
	};
};
