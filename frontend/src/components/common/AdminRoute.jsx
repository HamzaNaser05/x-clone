import { MdLockOutline } from "react-icons/md";
import { Link } from "react-router-dom";

const AdminRoute = ({ authUser, children }) => {
	if (authUser?.role === "ADMIN") return children;

	return (
		<main className='grid min-h-screen min-w-0 flex-1 place-items-center px-6 text-center'>
			<div className='max-w-md rounded-3xl border border-gray-800 bg-[#080808] px-8 py-12'>
				<MdLockOutline className='mx-auto h-12 w-12 text-primary' />
				<p className='mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-primary'>Error 403</p>
				<h1 className='mt-3 text-3xl font-black'>Admin access required</h1>
				<p className='mt-3 text-sm leading-6 text-slate-400'>
					Your account does not have permission to view this dashboard.
				</p>
				<Link to='/' className='btn btn-primary mt-7 rounded-full px-6 text-white'>Back to home</Link>
			</div>
		</main>
	);
};

export default AdminRoute;
