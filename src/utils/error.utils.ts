// Define proper error types
export interface ErrorData {
  message: string
  field?: string
  code?: string
}

export class ApiError extends Error {
  statusCode: number
  errors: ErrorData[]
  success: boolean
  data: null

  constructor(statusCode: number, message = "Something went wrong", errors: ErrorData[] = [], stack = "") {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    this.success = false
    this.data = null

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad Request", errors: ErrorData[] = []) {
    super(400, message, errors)
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", errors: ErrorData[] = []) {
    super(401, message, errors)
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden", errors: ErrorData[] = []) {
    super(403, message, errors)
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found", errors: ErrorData[] = []) {
    super(404, message, errors)
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict", errors: ErrorData[] = []) {
    super(409, message, errors)
  }
}

export class InternalServerError extends ApiError {
  constructor(message = "Internal Server Error", errors: ErrorData[] = []) {
    super(500, message, errors)
  }
}

