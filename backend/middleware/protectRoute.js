import prisma from "../db/prisma.js";
import jwt from "jsonwebtoken"
import { clearAuthCookie } from "../lib/utils/generateToken.js";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No Token PRovided" })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if (!decoded || typeof decoded === "string" || !decoded.userId) {
            return res.status(401).json({ error: "Unauthorized: Invalid Token" })
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            omit: { password: true }
        })

        if (!user) {
            clearAuthCookie(res);
            return res.status(401).json({ error: "Unauthorized: User not found" })
        }

        if ((decoded.tokenVersion ?? 0) !== user.tokenVersion) {
            clearAuthCookie(res);
            return res.status(401).json({ error: "Your session has expired. Please log in again." });
        }

        const { tokenVersion: _tokenVersion, ...safeUser } = user;
        req.user = safeUser;
        next()

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            clearAuthCookie(res);
            return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
        }

        console.error("Error in protectRoutes middleware", error);
        return res.status(500).json({ error: "internal Server Error" })
    }
}
