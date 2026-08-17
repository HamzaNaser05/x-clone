import express from 'express';
import authRoutes from './routes/auth.routes.js';
import dotenv from 'dotenv';
import { connectPostgreSQL } from './db/prisma.js';
import cookieParser from 'cookie-parser';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use("/api/auth", authRoutes);

app.get('/', (req, res) => {
    res.send("Server is ready")
})
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