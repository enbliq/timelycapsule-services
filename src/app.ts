import express from "express"
import dotenv from "dotenv"
import { errorHandler, notFoundHandler } from "./middleware/error.middleware"
import subscriptionRoutes from "./routes/subscription.routes"

dotenv.config()

export const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/api/subscriptions", subscriptionRoutes)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler) 

