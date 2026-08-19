const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 25;

export const getPaginationParams = (query) => {
    const requestedLimit = Number.parseInt(query.limit, 10);
    const limit = Number.isInteger(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;
    const cursor = typeof query.cursor === "string" && query.cursor.trim()
        ? query.cursor.trim()
        : null;

    return { cursor, limit };
};

export const createCursorPage = (records, limit, getCursor = (record) => record.id) => {
    const hasNextPage = records.length > limit;
    const items = hasNextPage ? records.slice(0, limit) : records;

    return {
        items,
        nextCursor: hasNextPage && items.length > 0
            ? getCursor(items[items.length - 1])
            : null
    };
};
