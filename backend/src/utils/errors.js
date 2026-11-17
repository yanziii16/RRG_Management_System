// backend/src/utils/errors.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden action') {
    super(message, 403);
  }
}

// Used by the Part 2 code. It extends AppError and sets both
// `status` and `statusCode` so either style of error handler can read it.
class HttpError extends AppError {
  constructor(status, message, details) {
    super(message, status);
    this.status = status;
    this.details = details;
  }
}

const badRequest = (msg, details) => new HttpError(400, msg, details);
const unauthorized = (msg = 'Unauthorized') => new HttpError(401, msg);
const forbidden = (msg = 'Forbidden') => new HttpError(403, msg);
const notFound = (msg = 'Not found') => new HttpError(404, msg);
const conflict = (msg) => new HttpError(409, msg);

module.exports = {
  AppError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  HttpError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
};