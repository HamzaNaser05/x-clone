import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FaArrowLeft } from "react-icons/fa6";
import { MdMarkEmailRead, MdOutlineMail } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import LoadingSpinner from "../../../components/common/LoadingSpinner";
import XSvg from "../../../components/svgs/X";
import { apiRequest } from "../../../lib/api";

const EmailVerificationPendingPage = () => {
	const location = useLocation();
	const [email, setEmail] = useState(
		() => location.state?.email || sessionStorage.getItem("pendingVerificationEmail") || ""
	);
	const [successMessage, setSuccessMessage] = useState(location.state?.email
		? "We sent an activation link to your email address."
		: "");

	const { mutate: resendVerification, isPending, isError, error } = useMutation({
		mutationFn: () => apiRequest("/api/auth/resend-verification", {
			method: "POST",
			body: { email: email.trim() },
		}),
		onSuccess: ({ message }) => {
			const normalizedEmail = email.trim();
			sessionStorage.setItem("pendingVerificationEmail", normalizedEmail);
			setSuccessMessage(message);
			toast.success("Verification email requested");
		},
	});

	const submit = (event) => {
		event.preventDefault();
		if (!email.trim() || isPending) return;
		setSuccessMessage("");
		resendVerification();
	};

	return (
		<main className='mx-auto flex min-h-screen w-full max-w-screen-xl px-6'>
			<div className='hidden flex-1 items-center justify-center lg:flex'>
				<XSvg className='w-2/3 fill-white' />
			</div>
			<div className='flex flex-1 flex-col items-center justify-center'>
				<section className='w-full max-w-sm rounded-2xl border border-gray-800 bg-[#080808] p-6'>
					<MdMarkEmailRead className='h-12 w-12 text-primary' aria-hidden='true' />
					<h1 className='mt-4 text-3xl font-extrabold text-white'>Check your email</h1>
					<p className='mt-3 text-sm leading-6 text-slate-400'>
						Open the verification link before logging in. The link expires after 24 hours.
					</p>

					<form className='mt-6 flex flex-col gap-4' onSubmit={submit}>
						<label className='text-sm font-medium text-white' htmlFor='verification-email'>Email address</label>
						<div className='input w-full rounded-lg border-gray-700 focus-within:border-primary'>
							<MdOutlineMail aria-hidden='true' />
							<input
								id='verification-email'
								type='email'
								autoComplete='email'
								placeholder='you@example.com'
								required
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								aria-invalid={isError}
								aria-describedby={isError ? "verification-resend-error" : undefined}
							/>
						</div>

						{successMessage && (
							<p className='rounded-lg border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-300' aria-live='polite'>
								{successMessage} Check your spam folder if it does not arrive.
							</p>
						)}
						{isError && <p id='verification-resend-error' className='text-sm text-red-400' role='alert'>{error.message}</p>}

						<button className='btn btn-primary rounded-full text-white' disabled={!email.trim() || isPending}>
							{isPending ? <LoadingSpinner size='sm' /> : "Resend verification email"}
						</button>
					</form>

					<Link to='/login' className='mt-5 inline-flex w-full items-center justify-center gap-2 text-sm text-slate-400 hover:text-white'>
						<FaArrowLeft className='h-3 w-3' aria-hidden='true' /> Back to login
					</Link>
				</section>
			</div>
		</main>
	);
};

export default EmailVerificationPendingPage;
