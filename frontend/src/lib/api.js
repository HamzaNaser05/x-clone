export const apiRequest = async (path, options = {}) => {
	const headers = new Headers(options.headers);
	let body = options.body;

	if (body && typeof body !== "string" && !(body instanceof FormData)) {
		headers.set("Content-Type", "application/json");
		body = JSON.stringify(body);
	}

	const response = await fetch(path, {
		credentials: "include",
		...options,
		headers,
		body,
	});

	const data = response.status === 204 ? [] : await response.json().catch(() => null);

	if (!response.ok) {
		const error = new Error(data?.error || data?.message || "Something went wrong");
		error.status = response.status;
		throw error;
	}

	return data;
};
