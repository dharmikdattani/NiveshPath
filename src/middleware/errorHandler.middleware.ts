import { ApiError } from '../utils/ApiError';
import { Request, Response, NextFunction, RequestHandler } from "express";

const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            status: err.statusCode,
            success: err.success,
            message: err.message,
            errors: err.errors,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }

    // fallback for other errors
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode).json({
        status: statusCode,
        success: false,
        message: err.message || 'Internal Server Error',
        errors: [],
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

export default errorHandler;