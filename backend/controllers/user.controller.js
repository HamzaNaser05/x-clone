import prisma from "../db/prisma.js";
import { v2 as cloudinary } from "cloudinary"
import bcrypt from "bcryptjs";

export const getUserProfile = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { username }
            ,
            omit: { password: true }
        }
        )
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message })
        console.log("Error in getUserProfile", error.message);
    }
}

export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;

        if (id === currentUserId) {
            return res.status(400).json({
                error: "You can't follow/unfollow yourself"
            });
        }

        const userToModify = await prisma.user.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!userToModify) {
            return res.status(404).json({ error: "User not found" });
        }

        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUserId,
                    followingId: id
                }
            }
        });

        if (existingFollow) {
            await prisma.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId: currentUserId,
                        followingId: id
                    }
                }
            });

            return res.status(200).json({
                message: "User unfollowed successfully"
            });
        }

        await prisma.$transaction([
            prisma.follow.create({
                data: {
                    followerId: currentUserId,
                    followingId: id
                }
            }),
            prisma.notification.create({
                data: {
                    type: "follow",
                    fromUserId: currentUserId,
                    toUserId: id
                }
            })
        ]);

        return res.status(200).json({
            message: "User followed successfully"
        });
    } catch (error) {
        console.log("Error in followUnfollowUser", error.message);
        return res.status(500).json({ error: error.message });
    }
};

export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.user.id;

        const usersFollowedByMe = await prisma.follow.findMany({
            where: {
                followerId: userId
            },
            select: {
                followingId: true
            }
        })

        const excludedUserIds = [userId, ...usersFollowedByMe.map((follow) => follow.followingId)]
        const suggestedUsers = await prisma.user.findMany({
            where: {
                id: {
                    notIn: excludedUserIds
                }
            },
            omit: {
                password: true
            },
            take: 10

        })

        return res.status(200).json(suggestedUsers);
    } catch (error) {
        console.log("Error in getSuggestedUsers", error.message);
        return res.status(500).json({ error: error.message })
    }
}

export const updateUser = async (req, res) => {

    const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
    let { profileImg, coverImg } = req.body;

    const userId = req.user.id;

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })
        if (!user) return res.status(404).json({ error: "User not found" })
        if ((!newPassword && currentPassword) || (newPassword && !currentPassword)) {
            return res.status(400).json({ error: "Please provide both current password and new password" })
        }
        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password)

            if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" })
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "Password must be at least 6 characters long" })
            }
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(newPassword, salt)
        }
        if (profileImg) {

            if (user.profileImg) {
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0])
            }

            const uploadedResponse = await cloudinary.uploader.upload(profileImg)
            profileImg = uploadedResponse.secure_url
        }
        if (coverImg) {

            if (coverImg) {
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0])
            }

            const uploadedResponse = await cloudinary.uploader.upload(coverImg)
            coverImg = uploadedResponse.secure_url
        }

        user.fullName = fullName || user.fullName
        user.email = email || user.email;
        user.username = username || user.username
        user.bio = bio || user.bio
        user.link = link || user.link
        user.profileImg = profileImg || user.profileImg
        user.coverImg = coverImg || user.coverImg;


        const updateUser = await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                fullName: user.fullName,
                email: user.email,
                username: user.username,
                password: user.password,
                bio: user.bio,
                link: user.link,
                profileImg: user.profileImg,
                coverImg: user.coverImg
            },
            omit: {
                password: true
            }
        })
        return res.status(200).json(updateUser)

    } catch (error) {
        console.log("Error in updateUser", error.message);
        return res.status(500).json({ error: error.message });
    }

}