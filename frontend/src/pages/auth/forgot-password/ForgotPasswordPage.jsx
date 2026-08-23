import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import { MdMarkEmailRead, MdOutlineMail } from "react-icons/md";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import LoadingSpinner from "../../../components/common/LoadingSpinner";
import XSvg from "../../../components/svgs/X";
import { apiRequest } from "../../../lib/api";

const ForgotPasswordPage = () => {
	const [email, setEmail] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const { mutate: requestReset, isPending, isError, error } = useMutation({
		mutationFn: () => apiRequest("/api/auth/forgot-password", {
			method: "POST",
			body: { email: email.trim() },
		}),
		onSuccess: ({ message }) => setSuccessMessage(message),
	});

	const submit = (event) => {
		event.preventDefault();
		if (!email.trim() || isPending) return;
		requestReset();
	};

	return (
		<main className='mx-auto flex min-h-screen w-full max-w-screen-xl px-6'>
			<div className='hidden flex-1 items-center justify-center lg:flex'>
				<XSvg className='w-2/3 fill-white' />
			</div>
			<div className='flex flex-1 flex-col items-center justify-center'>
				<div className='w-full max-w-sm'>
					<XSvg className='mb-6 w-16 fill-white lg:hidden' />
					{successMessage ? (
						<section className='rounded-2xl border border-gray-800 bg-[#080808] p-6 text-center' aria-live='polite'>
							<MdMarkEmailRead className='mx-auto h-12 w-12 text-primary' aria-hidden='true' />
							<h1 className='mt-4 text-2xl font-bold'>Check your email</h1>
							<p className='mt-3 text-sm leading-6 text-slate-400'>{successMessage}</p>
							<p className='mt-2 text-xs text-slate-500'>The link expires in 15 minutes. Check your spam folder if it does not arrive.</p>
							<Link to='/login' className='btn btn-primary mt-6 w-full rounded-full text-white'>Back to login</Link>
						</section>
					) : (
						<form className='flex flex-col gap-4' onSubmit={submit}>
							<p className='text-sm font-semibold uppercase tracking-[0.25em] text-primary'>Account recovery</p>
							<h1 className='text-4xl font-extrabold text-white'>Forgot your password?</h1>
							<p className='text-sm leading-6 text-slate-400'>Enter your account email and we will send you a secure reset link.</p>
							<label className='text-sm font-medium' htmlFor='reset-email'>Email address</label>
							<div className='input w-full rounded-lg border-gray-700 focus-within:border-primary'>
								<MdOutlineMail aria-hidden='true' />
								<input
									id='reset-email'
									type='email'
									placeholder='you@example.com'
									autoComplete='email'
									required
									value={email}
									onChange={(event) => setEmail(event.target.value)}
									aria-invalid={isError}
									aria-describedby={isError ? "forgot-password-error" : undefined}
								/>
							</div>
							{isError && <p id='forgot-password-error' className='text-sm text-red-400' role='alert'>{error.message}</p>}
							<button className='btn btn-primary rounded-full text-white' disabled={!email.trim() || isPending}>
								{isPending ? <LoadingSpinner size='sm' /> : "Send reset link"}
							</button>
							<Link to='/login' className='mt-2 inline-flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white'>
								<FaArrowLeft className='h-3 w-3' aria-hidden='true' /> Back to login
							</Link>
						</form>
					)}
				</div>
			</div>
		</main>
	);
};

export default ForgotPasswordPage;
