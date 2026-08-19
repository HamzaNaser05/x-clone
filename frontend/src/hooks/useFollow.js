import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { apiRequest } from "../lib/api";

const useFollow = () => {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (userId) => apiRequest(`/api/users/follow/${userId}`, { method: "POST" }),
		onSuccess: (data, userId) => {
			queryClient.setQueriesData({ queryKey: ["userProfile"] }, (profile) => (
				profile?.id === userId
					? {
						...profile,
						isFollowing: data.isFollowing,
						followersCount: data.followersCount,
					}
					: profile
			));
			queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] });
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
			queryClient.invalidateQueries({ queryKey: ["posts", "following"] });
			queryClient.invalidateQueries({ queryKey: ["userProfile"] });
			queryClient.invalidateQueries({ queryKey: ["search", "users"] });
		},
		onError: (error) => toast.error(error.message),
	});

	return {
		follow: mutation.mutate,
		isPending: mutation.isPending,
		pendingUserId: mutation.variables,
	};
};

export default useFollow;
