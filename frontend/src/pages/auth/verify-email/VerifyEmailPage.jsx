import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MdErrorOutline, MdVerified } from "react-icons/md";
import { Link, useParams } from "react-router-dom";

import LoadingSpinner from "../../../components/common/LoadingSpinner";
import XSvg from "../../../components/svgs/X";
import { apiRequest } from "../../../lib/api";

const VerifyEmailPage = () => {
	const { token } = useParams();
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["verifyEmail", token],
		queryFn: () => apiRequest(`/api/auth/verify-email/${encodeURIComponent(token || "")}`, {
			method: "POST",
		}),
		enabled: Boolean(token),
		retry: false,
		staleTime: Infinity,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		if (data) sessionStorage.removeItem("pendingVerificationEmail");
	}, [data]);

	return (
		<main className='mx-auto flex min-h-screen w-full max-w-screen-xl px-6'>
			<div className='hidden flex-1 items-center justify-center lg:flex'>
				<XSvg className='w-2/3 fill-white' />
			</div>
			<div className='flex flex-1 flex-col items-center justify-center'>
				<section className='w-full max-w-sm rounded-2xl border border-gray-800 bg-[#080808] p-6 text-center' aria-live='polite'>
					{isLoading && (
						<>
							<LoadingSpinner size='lg' />
							<h1 className='mt-5 text-2xl font-bold text-white'>Verifying your email…</h1>
							<p className='mt-2 text-sm text-slate-400'>This should only take a moment.</p>
						</>
					)}

					{data && (
						<>
							<MdVerified className='mx-auto h-14 w-14 text-emerald-400' aria-hidden='true' />
							<h1 className='mt-4 text-3xl font-extrabold text-white'>Email verified</h1>
							<p className='mt-3 text-sm leading-6 text-slate-400'>{data.message}</p>
							<Link to='/login' className='btn btn-primary mt-6 w-full rounded-full text-white'>Continue to login</Link>
						</>
					)}

					{isError && (
						<>
							<MdErrorOutline className='mx-auto h-14 w-14 text-red-400' aria-hidden='true' />
							<h1 className='mt-4 text-3xl font-extrabold text-white'>Link unavailable</h1>
							<p className='mt-3 text-sm leading-6 text-slate-400'>{error.message}</p>
							<Link to='/verify-email/pending' className='btn btn-primary mt-6 w-full rounded-full text-white'>Request a new link</Link>
						</>
					)}
				</section>
			</div>
		</main>
	);
};

export default VerifyEmailPage;
