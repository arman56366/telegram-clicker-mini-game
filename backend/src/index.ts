import express from "express"
import { Pool } from "pg"
import rateLimit from 'express-rate-limit';
import { createRouter } from "./routes"
import logger from "./logger"
import dotenv from "dotenv"

dotenv.config()

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
});

const app = express()
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "clicker_game",
  password: process.env.DB_PASSWORD || "password",
  port: parseInt(process.env.DB_PORT || "5432"),
})

app.use(limiter);
app.use(express.json())
app.use("/api", createRouter(pool))

const PORT = parseInt(process.env.SERVER_PORT || "3000")
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`)
  logger.info(`Server is running on port ${PORT}`)
})
