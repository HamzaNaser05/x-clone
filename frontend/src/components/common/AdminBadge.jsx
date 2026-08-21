import { MdVerified } from "react-icons/md";

const AdminBadge = ({ className = "" }) => (
	<span
		className={`inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary ${className}`}
		title='Administrator'
	>
		<MdVerified className='h-3 w-3' aria-hidden='true' />
		Admin
	</span>
);

export default AdminBadge;
