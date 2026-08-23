import prisma from "../db/prisma.js";
import bcrypt from "bcryptjs";
import { deleteImage, uploadImage } from "../services/cloudinary.service.js";
import { publishNotification } from "../services/notificationStream.service.js";
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const getUserProfile = async (req, res) => {
    const { username } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { username },
            omit: { password: true, tokenVersion: true },
            include: {
                followers: {
                    where: { followerId: req.user.id },
                    select: { followerId: true },
                    take: 1
                },
                _count: {
                    select: {
                        following: true,
                        followers: true
                    }
                }
            }
        })
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        const { followers, _count, ...profile } = user;
        res.status(200).json({
            ...profile,
            isFollowing: followers.length > 0,
            followingCount: _count.following,
            followersCount: _count.followers
        });
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
            const followersCount = await prisma.follow.count({
                where: { followingId: id }
            });

            return res.status(200).json({
                message: "User unfollowed successfully",
                isFollowing: false,
                followersCount
            });
        }

        const [, notification] = await prisma.$transaction([
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

        publishNotification(id, notification);
        const followersCount = await prisma.follow.count({
            where: { followingId: id }
        });

        return res.status(200).json({
            message: "User followed successfully",
            isFollowing: true,
            followersCount
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
                password: true,
                tokenVersion: true,
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
    const passwordChanged = Boolean(currentPassword && newPassword);

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
            if (Buffer.byteLength(newPassword, "utf8") > 72) {
                return res.status(400).json({ error: "Password cannot exceed 72 bytes" })
            }
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(newPassword, salt)
        }
        if (profileImg) {
            const previousProfileImg = user.profileImg;
            profileImg = await uploadImage(profileImg);
            await deleteImage(previousProfileImg);
        }
        if (coverImg) {
            const previousCoverImg = user.coverImg;
            coverImg = await uploadImage(coverImg);
            await deleteImage(previousCoverImg);
        }

        user.fullName = fullName || user.fullName
        user.email = email || user.email;
        user.username = username || user.username
        user.bio = bio || user.bio
        user.link = link || user.link
        user.profileImg = profileImg || user.profileImg
        user.coverImg = coverImg || user.coverImg;


        const updateQuery = prisma.user.update({
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
                coverImg: user.coverImg,
                ...(passwordChanged && { tokenVersion: { increment: 1 } }),
            },
            omit: {
                password: true,
                tokenVersion: true,
            }
        });
        const [updateUser] = passwordChanged
            ? await prisma.$transaction([
                updateQuery,
                prisma.passwordResetToken.deleteMany({ where: { userId } }),
            ])
            : [await updateQuery];

        if (passwordChanged) {
            generateTokenAndSetCookie({
                userId,
                tokenVersion: user.tokenVersion + 1,
                res,
            });
        }

        return res.status(200).json(updateUser)

    } catch (error) {
        console.log("Error in updateUser", error.message);
        return res.status(500).json({ error: error.message });
    }

}
