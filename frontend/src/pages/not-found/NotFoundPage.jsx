import { FaArrowLeft } from "react-icons/fa6";
import { Link, useLocation } from "react-router-dom";

import XSvg from "../../components/svgs/X";

const NotFoundPage = ({ isAuthenticated }) => {
	const location = useLocation();
	const destination = isAuthenticated ? "/" : "/login";

	return (
		<main className='grid min-h-screen min-w-0 flex-1 place-items-center px-6 py-16 text-center'>
			<div className='relative max-w-md overflow-hidden rounded-3xl border border-gray-800 bg-[#080808] px-8 py-12 shadow-2xl'>
				<XSvg className='absolute -right-10 -top-10 h-48 w-48 fill-white/[0.03]' />
				<p className='text-sm font-semibold uppercase tracking-[0.35em] text-primary'>Error 404</p>
				<h1 className='mt-4 text-4xl font-black sm:text-5xl'>This page flew away.</h1>
				<p className='mt-4 text-sm leading-6 text-slate-400'>
					The address <span className='break-all text-slate-300'>{location.pathname}</span> does not exist or may have moved.
				</p>
				<Link to={destination} className='btn btn-primary mt-8 rounded-full px-6 text-white'>
					<FaArrowLeft className='h-4 w-4' />
					{isAuthenticated ? "Back to home" : "Go to login"}
				</Link>
			</div>
		</main>
	);
};

export default NotFoundPage;
