import { useState } from "react";
import { MdOutlineMail, MdPassword } from "react-icons/md";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import XSvg from "../../../components/svgs/X";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { apiRequest } from "../../../lib/api";

const LoginPage = () => {
	const [formData, setFormData] = useState({ username: "", password: "" });
	const queryClient = useQueryClient();

	const { mutate: login, isPending, isError, error } = useMutation({
		mutationFn: (credentials) => apiRequest("/api/auth/login", { method: "POST", body: credentials }),
		onSuccess: (data) => queryClient.setQueryData(["authUser"], data.user || data),
	});

	const handleSubmit = (event) => {
		event.preventDefault();
		login(formData);
	};

	const handleInputChange = (event) => {
		setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
	};

	return (
		<main className='mx-auto flex min-h-screen w-full max-w-screen-xl px-6'>
			<div className='hidden flex-1 items-center justify-center lg:flex'>
				<XSvg className='w-2/3 fill-white' />
			</div>
			<div className='flex flex-1 flex-col items-center justify-center'>
				<form className='flex w-full max-w-sm flex-col gap-4' onSubmit={handleSubmit}>
					<XSvg className='w-16 fill-white lg:hidden' />
					<h1 className='mb-2 text-4xl font-extrabold text-white'>{"Let's"} go.</h1>
					<label className='input w-full rounded-lg border-gray-700 focus-within:border-primary'>
						<MdOutlineMail aria-hidden='true' />
						<input
							type='text'
							placeholder='Username'
							name='username'
							autoComplete='username'
							required
							onChange={handleInputChange}
							value={formData.username}
						/>
					</label>
					<label className='input w-full rounded-lg border-gray-700 focus-within:border-primary'>
						<MdPassword aria-hidden='true' />
						<input
							type='password'
							placeholder='Password'
							name='password'
							autoComplete='current-password'
							required
							onChange={handleInputChange}
							value={formData.password}
						/>
					</label>
					<Link to='/forgot-password' className='self-end text-sm text-primary hover:underline'>Forgot password?</Link>
					<button className='btn btn-primary rounded-full text-white' disabled={isPending}>
						{isPending ? <LoadingSpinner size='sm' /> : "Log in"}
					</button>
					{isError && <p className='text-sm text-red-500'>{error.message}</p>}
				</form>
				<div className='mt-6 flex w-full max-w-sm flex-col gap-2'>
					<p className='text-lg text-white'>{"Don't"} have an account?</p>
					<Link to='/signup' className='btn btn-outline btn-primary rounded-full'>Sign up</Link>
				</div>
			</div>
		</main>
	);
};

export default LoginPage;
