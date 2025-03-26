import type { Request, Response, NextFunction } from "express"
import { validationResult, type ValidationChain, type ValidationError } from "express-validator"
import { BadRequestError } from "../utils/error.utils"

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)))

    // Check for validation errors
    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    // Format errors and throw BadRequestError
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: error.type === "field" ? error.path : error.type,
      message: error.msg,
    }))

    throw new BadRequestError("Validation failed", formattedErrors)
  }
}

