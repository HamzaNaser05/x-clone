import express from 'express';
import authRoutes from './routes/auth.routes.js';
import userRoutes from "./routes/user.routes.js";
import dotenv from 'dotenv';
import { connectPostgreSQL } from './db/prisma.js';
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from "cloudinary"
import postRoutes from "./routes/post.routes.js"
import notificationsRoutes from "./routes/notifications.routes.js"
import searchRoutes from "./routes/search.routes.js"
import cors from "cors";

dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "8mb" }))
app.use(express.urlencoded({ extended: true, limit: "8mb" }))
app.use(cookieParser())
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationsRoutes)
app.use("/api/search", searchRoutes)

app.get('/', (req, res) => {
    res.send("Server is ready")
})

app.use((error, req, res, next) => {
    if (error.type === "entity.too.large") {
        return res.status(413).json({
            error: "Image is too large. Please choose an image smaller than 5 MB"
        });
    }

    return next(error);
});

const startServer = async () => {
    try {
        await connectPostgreSQL();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        })

    } catch (error) {
        console.error("Failed to start the server", error)
        process.exit(1);
    }
}
startServer();
