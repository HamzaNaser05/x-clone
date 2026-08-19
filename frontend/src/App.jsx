import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import BookmarksPage from "./pages/bookmarks/BookmarksPage";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/auth/login/LoginPage";
import NotificationPage from "./pages/notification/NotificationPage";
import PostPage from "./pages/post/PostPage";
import ProfilePage from "./pages/profile/ProfilePage";
import SignUpPage from "./pages/auth/signup/SignUpPage";
import LoadingSpinner from "./components/common/LoadingSpinner";
import RightPanel from "./components/common/RightPanel";
import Sidebar from "./components/common/Sidebar";
import { apiRequest } from "./lib/api";

function App() {
	const {
		data: authUser,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ["authUser"],
		queryFn: async () => {
			try {
				return await apiRequest("/api/auth/me");
			} catch (error) {
				if (error.status === 401 || error.status === 404) return null;
				throw error;
			}
		},
		retry: false,
	});

	if (isLoading) {
		return (
			<div className='grid min-h-screen place-items-center'>
				<LoadingSpinner size='lg' />
			</div>
		);
	}

	if (isError) {
		return (
			<div className='grid min-h-screen place-items-center px-6 text-center'>
				<div>
					<p className='text-lg font-bold'>Unable to reach the API.</p>
					<p className='mt-1 text-sm text-slate-500'>Make sure the backend is running on port 5000.</p>
					<button className='btn btn-primary btn-sm mt-4 rounded-full text-white' onClick={() => refetch()}>
						Try again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className='mx-auto flex min-h-screen max-w-6xl'>
			{authUser && <Sidebar />}
			<Routes>
				<Route path='/' element={authUser ? <HomePage /> : <Navigate to='/login' replace />} />
				<Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to='/' replace />} />
				<Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to='/' replace />} />
				<Route
					path='/notifications'
					element={authUser ? <NotificationPage /> : <Navigate to='/login' replace />}
				/>
				<Route
					path='/bookmarks'
					element={authUser ? <BookmarksPage /> : <Navigate to='/login' replace />}
				/>
				<Route
					path='/profile/:username'
					element={authUser ? <ProfilePage /> : <Navigate to='/login' replace />}
				/>
				<Route path='/post/:id' element={authUser ? <PostPage /> : <Navigate to='/login' replace />} />
				<Route path='*' element={<Navigate to={authUser ? "/" : "/login"} replace />} />
			</Routes>
			{authUser && <RightPanel />}
			<Toaster position='top-center' toastOptions={{ duration: 3500 }} />
		</div>
	);
}

export default App;
