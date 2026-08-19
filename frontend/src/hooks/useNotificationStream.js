import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const useNotificationStream = () => {
	const queryClient = useQueryClient();

	useEffect(() => {
		const eventSource = new EventSource("/api/notifications/stream", {
			withCredentials: true,
		});

		const handleNotification = () => {
			queryClient.setQueryData(["unreadNotifications"], (current = { count: 0 }) => ({
				count: current.count + 1,
			}));
			queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		};

		const handleUnreadCount = (event) => {
			try {
				queryClient.setQueryData(["unreadNotifications"], JSON.parse(event.data));
			} catch {
				queryClient.invalidateQueries({ queryKey: ["unreadNotifications"] });
			}
		};

		eventSource.addEventListener("notification", handleNotification);
		eventSource.addEventListener("unread-count", handleUnreadCount);

		return () => {
			eventSource.removeEventListener("notification", handleNotification);
			eventSource.removeEventListener("unread-count", handleUnreadCount);
			eventSource.close();
		};
	}, [queryClient]);
};

export default useNotificationStream;
