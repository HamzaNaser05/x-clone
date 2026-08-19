import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { apiRequest } from "../lib/api";

const useUpdateUserProfile = () => {
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (formData) => apiRequest("/api/users/update", { method: "POST", body: formData }),
		onSuccess: (updatedUser) => {
			toast.success("Profile updated successfully");
			queryClient.setQueryData(["authUser"], updatedUser);
			queryClient.invalidateQueries({ queryKey: ["userProfile"] });
		},
		onError: (error) => toast.error(error.message),
	});

	return {
		updateProfile: mutation.mutateAsync,
		isUpdatingProfile: mutation.isPending,
	};
};

export default useUpdateUserProfile;
