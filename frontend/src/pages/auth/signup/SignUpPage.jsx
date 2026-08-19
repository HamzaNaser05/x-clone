import { useState } from "react";
import { FaUser } from "react-icons/fa";
import { MdDriveFileRenameOutline, MdOutlineMail, MdPassword } from "react-icons/md";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import XSvg from "../../../components/svgs/X";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { apiRequest } from "../../../lib/api";

const SignUpPage = () => {
	const [formData, setFormData] = useState({ email: "", username: "", fullName: "", password: "" });
	const queryClient = useQueryClient();

	const { mutate: signUp, isPending, isError, error } = useMutation({
		mutationFn: (details) => apiRequest("/api/auth/signup", { method: "POST", body: details }),
		onSuccess: (user) => {
			toast.success("Account created successfully");
			queryClient.setQueryData(["authUser"], user);
		},
	});

	const handleSubmit = (event) => {
		event.preventDefault();
		signUp(formData);
	};

	const handleInputChange = (event) => {
		setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
	};

	const fields = [
		{ name: "email", type: "email", placeholder: "Email", icon: MdOutlineMail, autoComplete: "email" },
		{ name: "username", type: "text", placeholder: "Username", icon: FaUser, autoComplete: "username" },
		{ name: "fullName", type: "text", placeholder: "Full name", icon: MdDriveFileRenameOutline, autoComplete: "name" },
		{ name: "password", type: "password", placeholder: "Password", icon: MdPassword, autoComplete: "new-password" },
	];

	return (
		<main className='mx-auto flex min-h-screen w-full max-w-screen-xl px-6'>
			<div className='hidden flex-1 items-center justify-center lg:flex'>
				<XSvg className='w-2/3 fill-white' />
			</div>
			<div className='flex flex-1 flex-col items-center justify-center'>
				<form className='flex w-full max-w-md flex-col gap-4' onSubmit={handleSubmit}>
					<XSvg className='w-16 fill-white lg:hidden' />
					<h1 className='mb-2 text-4xl font-extrabold text-white'>Join today.</h1>
					{fields.map(({ name, type, placeholder, icon: Icon, autoComplete }) => (
						<label className='input w-full rounded-lg border-gray-700 focus-within:border-primary' key={name}>
							<Icon aria-hidden='true' />
							<input
								type={type}
								placeholder={placeholder}
								name={name}
								autoComplete={autoComplete}
								required
								minLength={name === "password" ? 6 : undefined}
								onChange={handleInputChange}
								value={formData[name]}
							/>
						</label>
					))}
					<button className='btn btn-primary rounded-full text-white' disabled={isPending}>
						{isPending ? <LoadingSpinner size='sm' /> : "Create account"}
					</button>
					{isError && <p className='text-sm text-red-500'>{error.message}</p>}
				</form>
				<div className='mt-6 flex w-full max-w-md flex-col gap-2'>
					<p className='text-lg text-white'>Already have an account?</p>
					<Link to='/login' className='btn btn-outline btn-primary rounded-full'>Sign in</Link>
				</div>
			</div>
		</main>
	);
};

export default SignUpPage;
