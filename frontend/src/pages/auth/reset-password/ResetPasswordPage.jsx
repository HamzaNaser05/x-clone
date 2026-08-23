import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdLockReset, MdPassword } from "react-icons/md";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import LoadingSpinner from "../../../components/common/LoadingSpinner";
import XSvg from "../../../components/svgs/X";
import { apiRequest } from "../../../lib/api";

const ResetPasswordPage = () => {
	const { token } = useParams();
	const queryClient = useQueryClient();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPasswords, setShowPasswords] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");
	const passwordsMatch = password === confirmPassword;
	const passwordMismatch = Boolean(confirmPassword && !passwordsMatch);
	const canSubmit = password.length >= 6 && passwordsMatch;

	const { mutate: resetPassword, isPending, isError, error } = useMutation({
		mutationFn: () => apiRequest(`/api/auth/reset-password/${encodeURIComponent(token || "")}`, {
			method: "POST",
			body: { password, confirmPassword },
		}),
		onSuccess: ({ message }) => {
			queryClient.setQueryData(["authUser"], null);
			setSuccessMessage(message);
		},
	});

	const submit = (event) => {
		event.preventDefault();
		if (!canSubmit || isPending) return;
		resetPassword();
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
							<MdLockReset className='mx-auto h-12 w-12 text-primary' aria-hidden='true' />
							<h1 className='mt-4 text-2xl font-bold'>Password updated</h1>
							<p className='mt-3 text-sm leading-6 text-slate-400'>{successMessage}</p>
							<Link to='/login' className='btn btn-primary mt-6 w-full rounded-full text-white'>Continue to login</Link>
						</section>
					) : (
						<form className='flex flex-col gap-4' onSubmit={submit}>
							<p className='text-sm font-semibold uppercase tracking-[0.25em] text-primary'>Account recovery</p>
							<h1 className='text-4xl font-extrabold text-white'>Create a new password</h1>
							<p className='text-sm leading-6 text-slate-400'>Use at least six characters and choose something you do not reuse elsewhere.</p>

							<label className='text-sm font-medium' htmlFor='new-password'>New password</label>
							<div className='input w-full rounded-lg border-gray-700 focus-within:border-primary'>
								<MdPassword aria-hidden='true' />
								<input
									id='new-password'
									type={showPasswords ? "text" : "password"}
									autoComplete='new-password'
									required
									minLength={6}
									maxLength={72}
									value={password}
									onChange={(event) => setPassword(event.target.value)}
								/>
								<button
									type='button'
									className='cursor-pointer rounded-full p-1 text-slate-500 hover:text-white'
									onClick={() => setShowPasswords((current) => !current)}
									aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
								>
									{showPasswords ? <FaEyeSlash aria-hidden='true' /> : <FaEye aria-hidden='true' />}
								</button>
							</div>

							<label className='text-sm font-medium' htmlFor='confirm-password'>Confirm password</label>
							<div className='input w-full rounded-lg border-gray-700 focus-within:border-primary'>
								<MdPassword aria-hidden='true' />
								<input
									id='confirm-password'
									type={showPasswords ? "text" : "password"}
									autoComplete='new-password'
									required
									minLength={6}
									maxLength={72}
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
									aria-invalid={passwordMismatch || isError}
									aria-describedby={passwordMismatch ? "password-match-error" : isError ? "reset-password-error" : undefined}
								/>
							</div>
							{passwordMismatch && <p id='password-match-error' className='text-sm text-red-400'>Passwords do not match.</p>}
							{isError && <p id='reset-password-error' className='text-sm text-red-400' role='alert'>{error.message}</p>}
							<button className='btn btn-primary rounded-full text-white' disabled={!canSubmit || isPending}>
								{isPending ? <LoadingSpinner size='sm' /> : "Reset password"}
							</button>
							<Link to='/forgot-password' className='text-center text-sm text-slate-400 hover:text-white'>Request a new link</Link>
						</form>
					)}
				</div>
			</div>
		</main>
	);
};

export default ResetPasswordPage;
