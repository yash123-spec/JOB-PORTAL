import { AppError } from "../utils/AppError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    // If error is not an instance of AppError, create a new one
    if (!(error instanceof AppError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Something went wrong";
        error = new AppError(statusCode, message, error?.errors || [], err.stack);
    }

    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
    };

    // Log the error
    console.error(response);

    return res.status(error.statusCode).json(response);
};

export { errorHandler };
