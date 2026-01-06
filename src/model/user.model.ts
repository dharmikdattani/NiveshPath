import { Schema, model, Document } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export interface IUser extends Document {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: number;
    currency?: string;
    profileImageUrl?: string;
    lastLogin?: Date;
    refreshToken: string;
    emailOtp?: string | null;
    emailOtpExpiry?: Date | null;
    passwordResetToken?: string | null;
    passwordResetExpires?: Date | null;
    emailOtpVerified?: boolean;
    createdAt: Date;
    updatedAt: Date;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): string;
    generateRefreshToken(): string;
}

const UserSchema = new Schema<IUser>(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        password: {
            type: String,
            required: false
        },
        phoneNumber: {
            type: Number
        },
        currency: {
            type: String,
            default: "INR"
        },
        profileImageUrl: {
            type: String
        },
        lastLogin: {
            type: Date
        },
        refreshToken: {
            type: String,
            required: false
        },
        emailOtp: {
            type: String,
            required: false,
            default: null
        },
        emailOtpExpiry: {
            type: Date,
            required: false
        },
        passwordResetToken: {
            type: String,
            required: false,
            default: null
        },
        passwordResetExpires: {
            type: Date,
            required: false
        },
        emailOtpVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

UserSchema.methods.isPasswordCorrect = async function (password: string) {
    return await bcrypt.compare(password, this.password)
}

UserSchema.methods.generateAccessToken = function () {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const expiry = process.env.ACCESS_TOKEN_EXPIRY;

    if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET environment variable is not defined');
    }

    if (!expiry) {
        throw new Error('ACCESS_TOKEN_EXPIRY environment variable is not defined');
    }

    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName,
        },
        secret as jwt.Secret,
        {
            expiresIn: expiry,
        } as jwt.SignOptions
    );
};

// Assuming UserSchema is a Mongoose schema
UserSchema.methods.generateRefreshToken = function () {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const expiry = process.env.REFRESH_TOKEN_EXPIRY;

    if (!secret) {
        throw new Error('REFRESH_TOKEN_SECRET environment variable is not defined');
    }

    if (!expiry) {
        throw new Error('REFRESH_TOKEN_EXPIRY environment variable is not defined');
    }

    return jwt.sign(
        {
            _id: this._id,
        },
        secret as jwt.Secret, // Explicitly cast to jwt.Secret
        {
            expiresIn: expiry,
        } as jwt.SignOptions // Explicitly cast to jwt.SignOptions
    );
};

export const User = model<IUser>("User", UserSchema);
