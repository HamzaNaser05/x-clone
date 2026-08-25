import prisma from "../db/prisma.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { clearAuthCookie, generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import { sendEmailVerification, sendPasswordResetEmail } from "../services/email.service.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
const RESET_TOKEN_LIFETIME_MS = 15 * 60 * 1000;
const EMAIL_VERIFICATION_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
const GENERIC_RESET_MESSAGE = "If an account exists for that email, a reset link has been sent.";
const GENERIC_VERIFICATION_MESSAGE = "If an unverified account exists for that email, a new verification link has been sent.";

const issueEmailVerification = async ({ id: userId, email }) => {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_LIFETIME_MS);

    await prisma.emailVerificationToken.upsert({
        where: { userId },
        update: {
            tokenHash,
            expiresAt,
            createdAt: new Date(),
        },
        create: {
            userId,
            tokenHash,
            expiresAt,
        },
    });

    try {
        await sendEmailVerification({ email, token });
    } catch (error) {
        await prisma.emailVerificationToken.deleteMany({ where: { tokenHash } });
        throw error;
    }
};

export const signup = async (req, res) => {
    try {
        const fullName = typeof req.body.fullName === "string" ? req.body.fullName.trim() : "";
        const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
        const password = typeof req.body.password === "string" ? req.body.password : "";

        if (!fullName || !username) {
            return res.status(400).json({ error: "Full name and username are required" });
        }
        if (!EMAIL_PATTERN.test(email)) {
            return res.status(400).json({ error: "Invalid email format" })
        }
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: "Username is already taken" })
        }
        const existingEmail = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } }
        })
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already taken" })
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" })
        }
        if (Buffer.byteLength(password, "utf8") > 72) {
            return res.status(400).json({ error: "Password cannot exceed 72 bytes" });
        }

        //hashing the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                fullName,
                username,
                email,
                password: hashedPassword,
                emailVerifiedAt: null,
            },
            select: {
                id: true,
                email: true,
            }
        })

        try {
            await issueEmailVerification(user);
        } catch (emailError) {
            await prisma.user.delete({ where: { id: user.id } });
            console.error("Unable to send signup verification email:", emailError);
            return res.status(503).json({
                error: "Unable to send the verification email. Please try creating your account again.",
            });
        }

        return res.status(201).json({
            message: "Account created. Check your email to activate it before logging in.",
            email: user.email,
        });

    } catch (error) {
        console.log("Error in the signup controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

export const login = async (req, res) => {
    try {
        const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
        const password = typeof req.body.password === "string" ? req.body.password : "";
        const user = await prisma.user.findUnique({ where: { username } });

        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "")

        if (!user || !isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" })
        }
        if (!user.emailVerifiedAt) {
            return res.status(403).json({
                error: "Verify your email address before logging in.",
                code: "EMAIL_NOT_VERIFIED",
                email: user.email,
            });
        }

        generateTokenAndSetCookie({
            userId: user.id,
            tokenVersion: user.tokenVersion,
            res,
        });

        const { password: _password, tokenVersion: _tokenVersion, ...safeUser } = user;

        res.status(200).json({
            user: safeUser
        })

    } catch (error) {
        console.log("Error in the login controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

export const logout = async (req, res) => {

    try {
        clearAuthCookie(res);
        res.status(200).json({ message: "Logged out successfully" })
    } catch (error) {
        console.log("Error in the logout controller", error.message);
        res.status(500).json({ error: "Internal Server Error" })
    }
}

export const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            },
            omit: {
                password: true,
                tokenVersion: true,
            }
        })
        res.status(200).json(user);

    } catch (error) {
        console.log("Error in getMe controller", error.message);
        res.status(500).json({error: "Internal Server Error"})
    }
}

export const forgotPassword = async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ error: "Please provide a valid email address" });
    }

    try {
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: { id: true, email: true }
        });

        if (!user) {
            return res.status(200).json({ message: GENERIC_RESET_MESSAGE });
        }

        const token = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const expiresAt = new Date(Date.now() + RESET_TOKEN_LIFETIME_MS);

        await prisma.passwordResetToken.upsert({
            where: { userId: user.id },
            update: {
                tokenHash,
                expiresAt,
                createdAt: new Date(),
            },
            create: {
                userId: user.id,
                tokenHash,
                expiresAt,
            },
        });

        try {
            await sendPasswordResetEmail({ email: user.email, token });
        } catch (emailError) {
            await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
            console.error("Unable to send password reset email:", emailError);
            return res.status(500).json({ error: "Unable to send the reset email. Please try again later." });
        }

        return res.status(200).json({ message: GENERIC_RESET_MESSAGE });
    } catch (error) {
        console.error("Error requesting password reset:", error);
        return res.status(500).json({ error: "Unable to process the password reset request" });
    }
};

export const resendEmailVerification = async (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ error: "Please provide a valid email address" });
    }

    try {
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: { id: true, email: true, emailVerifiedAt: true },
        });

        if (!user || user.emailVerifiedAt) {
            return res.status(200).json({ message: GENERIC_VERIFICATION_MESSAGE });
        }

        try {
            await issueEmailVerification(user);
        } catch (emailError) {
            console.error("Unable to resend email verification:", emailError);
        }

        return res.status(200).json({ message: GENERIC_VERIFICATION_MESSAGE });
    } catch (error) {
        console.error("Error resending email verification:", error);
        return res.status(500).json({ error: "Unable to process the verification request" });
    }
};

export const verifyEmail = async (req, res) => {
    const token = typeof req.params.token === "string" ? req.params.token.trim() : "";

    if (!TOKEN_PATTERN.test(token)) {
        return res.status(400).json({ error: "This verification link is invalid or has expired" });
    }

    try {
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const verificationToken = await prisma.emailVerificationToken.findUnique({
            where: { tokenHash },
            select: {
                id: true,
                userId: true,
                expiresAt: true,
            },
        });

        if (!verificationToken || verificationToken.expiresAt <= new Date()) {
            if (verificationToken) {
                await prisma.emailVerificationToken.deleteMany({ where: { id: verificationToken.id } });
            }
            return res.status(400).json({ error: "This verification link is invalid or has expired" });
        }

        const verified = await prisma.$transaction(async (transaction) => {
            const consumedToken = await transaction.emailVerificationToken.deleteMany({
                where: {
                    id: verificationToken.id,
                    tokenHash,
                    expiresAt: { gt: new Date() },
                },
            });

            if (consumedToken.count !== 1) return false;

            await transaction.user.update({
                where: { id: verificationToken.userId },
                data: { emailVerifiedAt: new Date() },
            });
            return true;
        });

        if (!verified) {
            return res.status(400).json({ error: "This verification link is invalid or has expired" });
        }

        return res.status(200).json({ message: "Email verified successfully. You can now log in." });
    } catch (error) {
        console.error("Error verifying email:", error);
        return res.status(500).json({ error: "Unable to verify the email address" });
    }
};

export const resetPassword = async (req, res) => {
    const token = typeof req.params.token === "string" ? req.params.token.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const confirmPassword = typeof req.body.confirmPassword === "string" ? req.body.confirmPassword : "";

    if (!TOKEN_PATTERN.test(token)) {
        return res.status(400).json({ error: "This password reset link is invalid or has expired" });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
        return res.status(400).json({ error: "Password cannot exceed 72 bytes" });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
    }

    try {
        const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { tokenHash },
            select: {
                id: true,
                userId: true,
                expiresAt: true,
            },
        });

        if (!resetToken || resetToken.expiresAt <= new Date()) {
            if (resetToken) {
                await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
            }
            return res.status(400).json({ error: "This password reset link is invalid or has expired" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetToken.userId },
                data: {
                    password: hashedPassword,
                    tokenVersion: { increment: 1 },
                    emailVerifiedAt: new Date(),
                },
            }),
            prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
            prisma.emailVerificationToken.deleteMany({ where: { userId: resetToken.userId } }),
        ]);

        clearAuthCookie(res);
        return res.status(200).json({ message: "Password reset successfully. You can now log in." });
    } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ error: "Unable to reset password" });
    }
};
