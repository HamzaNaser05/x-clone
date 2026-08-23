import express from "express"
import {
    forgotPassword,
    getMe,
    login,
    logout,
    resetPassword,
    signup,
} from "../controllers/auth.controller.js"
import {protectRoute} from "../middleware/protectRoute.js"

const router = express.Router()

router.get("/me", protectRoute, getMe)

router.post("/signup", signup)

router.post("/login", login)

router.post("/forgot-password", forgotPassword)

router.post("/reset-password/:token", resetPassword)

router.post("/logout", logout)


export default router;
