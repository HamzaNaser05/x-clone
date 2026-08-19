import { useState } from "react";
import { useNavigate } from "react-router-dom";

import useUpdateUserProfile from "../../hooks/useUpdateUserProfile";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const formFromUser = (user) => ({
	fullName: user?.fullName || "",
	username: user?.username || "",
	email: user?.email || "",
	bio: user?.bio || "",
	link: user?.link || "",
	currentPassword: "",
	newPassword: "",
});

const EditProfileModal = ({ authUser }) => {
	const [formData, setFormData] = useState(() => formFromUser(authUser));
	const { updateProfile, isUpdatingProfile } = useUpdateUserProfile();
	const navigate = useNavigate();

	const openModal = () => {
		setFormData(formFromUser(authUser));
		document.getElementById("edit-profile-modal")?.showModal();
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		const updatedUser = await updateProfile(formData);
		document.getElementById("edit-profile-modal")?.close();
		if (updatedUser?.username && updatedUser.username !== authUser.username) {
			navigate(`/profile/${updatedUser.username}`, { replace: true });
		}
	};

	return (
		<>
			<button type='button' className='btn btn-outline btn-sm rounded-full' onClick={openModal}>Edit profile</button>
			<dialog id='edit-profile-modal' className='modal'>
				<div className='modal-box rounded-2xl border border-gray-700 bg-black shadow-xl'>
					<h2 className='mb-4 text-xl font-bold'>Update profile</h2>
					<form className='flex flex-col gap-3' onSubmit={handleSubmit}>
						<div className='grid gap-3 sm:grid-cols-2'>
							<input className='input w-full rounded-lg border-gray-700' name='fullName' placeholder='Full name' value={formData.fullName} onChange={(event) => setFormData({ ...formData, fullName: event.target.value })} />
							<input className='input w-full rounded-lg border-gray-700' name='username' placeholder='Username' value={formData.username} onChange={(event) => setFormData({ ...formData, username: event.target.value })} />
						</div>
						<input type='email' className='input w-full rounded-lg border-gray-700' name='email' placeholder='Email' value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} />
						<textarea className='textarea w-full rounded-lg border-gray-700' name='bio' placeholder='Bio' value={formData.bio} onChange={(event) => setFormData({ ...formData, bio: event.target.value })} />
						<input className='input w-full rounded-lg border-gray-700' name='link' placeholder='Link' value={formData.link} onChange={(event) => setFormData({ ...formData, link: event.target.value })} />
						<div className='grid gap-3 sm:grid-cols-2'>
							<input type='password' autoComplete='current-password' className='input w-full rounded-lg border-gray-700' name='currentPassword' placeholder='Current password' value={formData.currentPassword} onChange={(event) => setFormData({ ...formData, currentPassword: event.target.value })} />
							<input type='password' autoComplete='new-password' className='input w-full rounded-lg border-gray-700' name='newPassword' placeholder='New password' value={formData.newPassword} onChange={(event) => setFormData({ ...formData, newPassword: event.target.value })} />
						</div>
						<button className='btn btn-primary btn-sm rounded-full text-white' disabled={isUpdatingProfile}>
							{isUpdatingProfile ? <LoadingSpinner size='sm' /> : "Save changes"}
						</button>
					</form>
				</div>
				<form method='dialog' className='modal-backdrop'><button>Close</button></form>
			</dialog>
		</>
	);
};

export default EditProfileModal;
