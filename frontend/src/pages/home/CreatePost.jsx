import { useRef, useState } from "react";
import { CiImageOn } from "react-icons/ci";
import { IoCloseSharp } from "react-icons/io5";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import LoadingSpinner from "../../components/common/LoadingSpinner";
import MentionTextarea from "../../components/common/MentionTextarea";
import { apiRequest } from "../../lib/api";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const CreatePost = () => {
	const [text, setText] = useState("");
	const [img, setImg] = useState(null);
	const imgRef = useRef(null);
	const queryClient = useQueryClient();
	const { data: authUser } = useQuery({ queryKey: ["authUser"] });

	const { mutate: createPost, isPending } = useMutation({
		mutationFn: (payload) => apiRequest("/api/posts/create", { method: "POST", body: payload }),
		onSuccess: () => {
			setText("");
			setImg(null);
			if (imgRef.current) imgRef.current.value = "";
			toast.success("Post created successfully");
			queryClient.invalidateQueries({ queryKey: ["posts"] });
		},
		onError: (error) => toast.error(error.message),
	});

	const handleSubmit = (event) => {
		event.preventDefault();
		if ((!text.trim() && !img) || isPending) return;
		createPost({ text: text.trim(), img });
	};

	const handleImageChange = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			toast.error("Please choose a valid image file");
			event.target.value = "";
			return;
		}

		if (file.size > MAX_IMAGE_SIZE) {
			toast.error("Image must be smaller than 5 MB");
			event.target.value = "";
			return;
		}

		const reader = new FileReader();
		reader.onload = () => setImg(reader.result);
		reader.onerror = () => toast.error("Unable to read this image");
		reader.readAsDataURL(file);
	};

	return (
		<div className='flex items-start gap-4 border-b border-gray-800 p-4'>
		<div className='avatar'>
			<div className='w-10 rounded-full'>
				<img src={authUser?.profileImg || "/avatar-placeholder.png"} alt='' />
			</div>
		</div>
		<form className='flex w-full min-w-0 flex-col gap-2' onSubmit={handleSubmit}>
			<MentionTextarea
				className='textarea w-full resize-none border-none bg-transparent p-0 text-lg focus:outline-none'
				placeholder='What is happening? Use @username to mention someone'
				value={text}
				onValueChange={setText}
				maxLength={1000}
			/>
			{img && (
				<div className='relative mx-auto w-full max-w-md'>
					<button
						type='button'
						className='absolute right-2 top-2 rounded-full bg-gray-900/80 p-1 text-white'
						onClick={() => {
							setImg(null);
							if (imgRef.current) imgRef.current.value = "";
						}}
						aria-label='Remove image'
					>
						<IoCloseSharp className='h-5 w-5' />
					</button>
					<img src={img} className='max-h-96 w-full rounded-xl object-contain' alt='Post preview' />
				</div>
			)}
			<div className='flex items-center justify-between border-t border-gray-800 py-2'>
				<div className='flex items-center gap-2 text-primary'>
					<button type='button' onClick={() => imgRef.current?.click()} aria-label='Add image' className="cursor-pointer">
						<CiImageOn className='h-6 w-6' />
					</button>
				</div>
				<input type='file' accept='image/*' hidden ref={imgRef} onChange={handleImageChange} />
				<button
					className='btn btn-primary btn-sm rounded-full px-5 text-white'
					disabled={(!text.trim() && !img) || isPending}
				>
					{isPending ? <LoadingSpinner size='sm' /> : "Post"}
				</button>
			</div>
		</form>
	</div>
	);
};

export default CreatePost;
