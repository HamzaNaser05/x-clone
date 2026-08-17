import prisma from "../db/prisma.js";
import jwt from "jsonwebtoken"

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No Token PRovided" })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if (!decoded) {
            return res.status(401).json({ error: "Unauthorized: Invalid Token" })
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            omit: { password: true }
        })

        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }
        req.user = user;
        next()

    } catch (error) {
        console.log("Error in protectRoutes middleware", error.message);
        return res.status(500).json({ error: "internal Server Error" })
    }
}