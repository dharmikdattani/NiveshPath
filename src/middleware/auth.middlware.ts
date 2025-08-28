import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { User } from "../model/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";

declare global {
    namespace Express {
        interface Request {
            user?: any; // You can replace 'any' with your User type
        }
    }
}

interface DecodedToken extends JwtPayload {
    _id: string;
    email: string;
    fullName: string;
}

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized - No token provided");
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
        throw new ApiError(500, "Server configuration error");
    }

    let decodedToken: DecodedToken;
    try {
        decodedToken = jwt.verify(token, secret) as DecodedToken;
    } catch (err) {
        throw new ApiError(401, "Unauthorized - Invalid token");
    }

    const user = await User.findById(decodedToken._id).select("-password");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    req.user = user;
    next();
});
