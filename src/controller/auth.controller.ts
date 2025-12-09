import { userSchema, loginValidationSchema, changePasswordSchema } from "../schema/auth.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { User } from "../model/user.model"
import jwt, { JwtPayload } from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId: String) => {
    try {

        const user = await User.findById(userId)

        if (!user) {
            throw new ApiError(404, "User not found")
        }

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        const userDetailsUpdated = await user.save({ validateBeforeSave: false })

        if (!userDetailsUpdated) {
            throw new ApiError(500, "Something went wrong while updating user details")
        }

        return ({
            accessToken,
            refreshToken
        })

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const { error, value } = userSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({ sucess: false, message: "Bad request", errors: error.details.map(err => err.message) });
    }

    const ExistingUser = await User.findOne({
        email: value.email
    })

    if (ExistingUser) {
        throw new ApiError(400, "User already exists")
    }

    const user = await User.create({
        ...value,
    })

    const userCheck = await User.findById(user._id).select(
        "-password"
    )

    if (!userCheck) throw new ApiError(500, "Something went wrong while creating user")

    if (!userCheck) {
        throw new ApiError(400, "Something went wrong while creating user")
    }

    return res.status(201).json(
        new ApiResponse(201, "User created successfully", userCheck)
    );
});

const loginUser = asyncHandler(async (req, res) => {

    const { error, value } = loginValidationSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({ sucess: false, message: "Bad request", errors: error.details.map(err => err.message) });
    }

    const user = await User.findOne({
        email: value.email
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isPasswordCorrect = await user.isPasswordCorrect((value.password))

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(String(user._id).toString())

    const loggedInUser = await User.findById(user._id).select(
        "-password"
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
        status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(
            new ApiResponse(200, "User logged in successfully", loggedInUser)
        )

})

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
        status(200)
        .clearCookie("refreshToken", options)
        .clearCookie("accessToken", options)
        .json(
            new ApiResponse(200, "User logged out successfully", {})
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incominRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incominRefreshToken) throw new ApiError(401, "Unauthorized request")

    const decodedToken = jwt.verify(incominRefreshToken, (process.env.REFRESH_TOKEN_SECRET as string)) as JwtPayload

    const user = await User.findById(decodedToken?._id)

    if (!user) throw new ApiError(401, "Invalid refresh token")

    if (user.refreshToken !== incominRefreshToken) throw new ApiError(401, "Refresh token is expired or used")

    const options = {
        httpOnly: true,
        secure: true
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(String(user._id))

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "Token refreshed successfully", { accessToken, refreshToken })
        )

})

const changePassword = asyncHandler(async (req, res) => {

    const { error, value } = changePasswordSchema.validate(req.body, { abortEarly: false })

    if (error) {
        return res.status(400).json({ sucess: false, message: "Bad request", errors: error.details.map(err => err.message) });
    }

    const user = await User.findById(req.user?._id)

    if (!user) throw new ApiError(404, "User Not Found")

    const isPasswordCorrect = await user.isPasswordCorrect(value.oldPassword)

    if (!isPasswordCorrect) throw new ApiError(401, "Invalid old password")

    user.password = value.newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, "Password changed successfully", {}))
})

const getLoggedInUserDetails = asyncHandler(async (req, res) => {

    return res
        .status(200)
        .json(
            new ApiResponse(200, "current user fetched sucessfully !!", { data: req?.user })
        )

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getLoggedInUserDetails
}