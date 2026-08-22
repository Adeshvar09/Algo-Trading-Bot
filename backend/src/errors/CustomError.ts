export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class NotFoundError extends CustomError {
  constructor(message = 'Resource Not Found') {
    super(message, 404);
  }
}

export class ValidationError extends CustomError {
  constructor(message = 'Validation Error') {
    super(message, 400);
  }
}
