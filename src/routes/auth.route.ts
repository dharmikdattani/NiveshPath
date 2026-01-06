import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getLoggedInUserDetails, forgotPassword, verifyPasswordOTP, resetPassword } from "../controller/auth.controller"
import { verifyJWT } from "../middleware/auth.middlware"
import { homePageDetails } from "../controller/home.controller"

const router = Router()

router.route("/register").post(registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refreshToken").post(refreshAccessToken)

router.route("/change-Password").post(verifyJWT, changePassword)

router.route("/").get(verifyJWT, getLoggedInUserDetails)

router.route("/home").get(verifyJWT, homePageDetails)

router.route("/forgot-password").post(forgotPassword)

router.route("/verify-otp").post(verifyPasswordOTP)

router.route("/reset-password").post(resetPassword)

export default router
