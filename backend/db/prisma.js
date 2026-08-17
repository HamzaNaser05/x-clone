import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined")
}

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
})

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") 
    globalForPrisma.prisma = prisma;

export const connectPostgreSQL = async () => {
    await prisma.$connect();
    console.log("PostgreSQL connected through prisma")
}
export default prisma;