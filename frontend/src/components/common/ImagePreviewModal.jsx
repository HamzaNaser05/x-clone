import { useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";

const ImagePreviewModal = ({ imageUrl, alt = "Image preview", onClose }) => {
	const dialogRef = useRef(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		if (imageUrl && !dialog.open) dialog.showModal();
		if (!imageUrl && dialog.open) dialog.close();
	}, [imageUrl]);

	const closePreview = () => {
		dialogRef.current?.close();
	};

	return (
		<dialog
			ref={dialogRef}
			className='m-auto h-dvh max-h-none w-screen max-w-none bg-black/90 p-0 text-white backdrop:bg-black/90'
			onClose={onClose}
			aria-label={alt}
		>
			<div className='relative grid h-full w-full cursor-pointer place-items-center p-4' onClick={closePreview}>
				<button
					type='button'
					className='absolute right-4 top-4 z-10 rounded-full bg-black/70 p-2 text-white transition hover:bg-white/20'
					onClick={closePreview}
					aria-label='Close image preview'
					autoFocus
				>
					<IoClose className='h-6 w-6' />
				</button>
				{imageUrl && (
					<img
						src={imageUrl}
						className='max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] cursor-default object-contain'
						alt={alt}
						onClick={(event) => event.stopPropagation()}
					/>
				)}
			</div>
		</dialog>
	);
};

export default ImagePreviewModal;
