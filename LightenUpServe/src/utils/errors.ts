export class AppError extends Error {
  status: number

  constructor(message: string, status: number = 500) {
    super(message)
    this.status = status
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404)
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}
