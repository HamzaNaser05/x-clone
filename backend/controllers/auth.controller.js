import prisma from "../db/prisma.js";
import bcrypt from "bcryptjs"
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";


export const signup = async (req, res) => {
    try {

        const { fullName, username, email, password } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" })
        }
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: "Username is already taken" })
        }
        const existingEmail = await prisma.user.findUnique({ where: { email } })
        if (existingEmail) {
            return res.status(400).json({ error: "Email is already taken" })
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" })
        }

        //hashing the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                fullName,
                username,
                email,
                password: hashedPassword
            },
            select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                profileImg: true,
                coverImg: true,
                bio: true,
                link: true,
                createdAt: true,
                updatedAt: true,

            }
        })
        if (user) {
            generateTokenAndSetCookie(user.id, res)
            return res.status(201).json(user)
        } else {
            res.status(400).json({ error: "Invalid user data" })
        }

    } catch (error) {
        console.log("Error in the signup controller", error.message);
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        let user = await prisma.user.findUnique(
            {
                where: { username }
            },
            {
                select: {
                    id: true,
                    fullName: true,
                    username: true,
                    email: true,
                    passwor: true,
                    profileImg: true,
                    coverImg: true,
                    bio: true,
                    link: true,
                    createdAt: true,
                    updatedAt: true,
                }
            }
        );

        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "")

        if (!user || !isPasswordCorrect) {
            return res.status(400).json({ error: "Invalid username or password" })
        }

        generateTokenAndSetCookie(user.id, res);

        const { password: _password, ...safeUser } = user;

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
        res.cookie("jwt", "", { maxAge: 0 })
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
                password: true
            }
        })
        res.status(200).json(user);

    } catch (error) {
        console.log("Error in getMe controller", error.message);
        res.status(500).json({error: "Internal Server Error"})
    }
}