import { v2 as cloudinary } from "cloudinary";

export const getCloudinaryPublicId = (imageUrl) => {
    if (typeof imageUrl !== "string" || !imageUrl.trim()) return null;

    try {
        const pathSegments = new URL(imageUrl).pathname.split("/").filter(Boolean);
        const uploadIndex = pathSegments.indexOf("upload");
        if (uploadIndex === -1) return null;

        const versionIndex = pathSegments.findIndex(
            (segment, index) => index > uploadIndex && /^v\d+$/.test(segment)
        );
        const publicIdSegments = pathSegments.slice(
            versionIndex === -1 ? uploadIndex + 1 : versionIndex + 1
        );

        if (publicIdSegments.length === 0) return null;

        const filename = publicIdSegments.pop();
        const extensionIndex = filename.lastIndexOf(".");
        const filenameWithoutExtension = extensionIndex === -1
            ? filename
            : filename.slice(0, extensionIndex);

        return decodeURIComponent([...publicIdSegments, filenameWithoutExtension].join("/"));
    } catch {
        return null;
    }
};

export const uploadImage = async (imageData) => {
    const uploadedImage = await cloudinary.uploader.upload(imageData, {
        resource_type: "image"
    });

    return uploadedImage.secure_url;
};

export const deleteImage = async (imageUrl) => {
    const publicId = getCloudinaryPublicId(imageUrl);
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    } catch (error) {
        console.warn("Unable to remove old Cloudinary image:", error.message);
    }
};
