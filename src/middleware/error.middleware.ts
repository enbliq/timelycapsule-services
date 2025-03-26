import type { Request, Response, ErrorRequestHandler } from "express"
import { ApiError } from "../utils/error.utils"
import { sendErrorResponse } from "../utils/response.utils"

// Define error handler as an ErrorRequestHandler
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
): void => {
  console.error("Error:", err)

  // Handle ApiError instances
  if (err instanceof ApiError) {
    sendErrorResponse(res, err.message, err.statusCode, err.errors)
    return
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    sendErrorResponse(res, "Validation Error", 400, [{ message: err.message }])
    return
  }

  // Handle Mongoose duplicate key errors
  if (err.name === "MongoError" && (err as { code?: number }).code === 11000) {
    sendErrorResponse(res, "Duplicate Key Error", 409, [{ message: "Duplicate key error" }])
    return
  }

  // Handle other errors
  sendErrorResponse(res, "Internal Server Error", 500, [{ message: err.message }])
}

export const notFoundHandler = (
  req: Request,
  res: Response,
): void => {
  sendErrorResponse(res, `Cannot ${req.method} ${req.originalUrl}`, 404)
}
