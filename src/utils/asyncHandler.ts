import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => RequestHandler;

const asyncHandler: AsyncHandler =
    (fn) => async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error: unknown) {
            if (error instanceof Error) {
                res.status((error as any).code || 500).json({
                    success: false,
                    message: error.message,
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: "Something went wrong",
                });
            }
        }
    };

export { asyncHandler };
