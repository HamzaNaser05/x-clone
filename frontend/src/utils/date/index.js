export const formatPostDate = (createdAt) => {
	const createdAtDate = new Date(createdAt);
	if (Number.isNaN(createdAtDate.getTime())) return "";

	const differenceInSeconds = Math.max(0, Math.floor((Date.now() - createdAtDate.getTime()) / 1000));
	const differenceInMinutes = Math.floor(differenceInSeconds / 60);
	const differenceInHours = Math.floor(differenceInMinutes / 60);
	const differenceInDays = Math.floor(differenceInHours / 24);

	if (differenceInDays > 1) {
		return createdAtDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	}
	if (differenceInDays === 1) return "1d";
	if (differenceInHours >= 1) return `${differenceInHours}h`;
	if (differenceInMinutes >= 1) return `${differenceInMinutes}m`;
	return "Just now";
};

export const formatMemberSinceDate = (createdAt) => {
	const date = new Date(createdAt);
	if (Number.isNaN(date.getTime())) return "";
	return `Joined ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
};
