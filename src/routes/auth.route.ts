import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getLoggedInUserDetails } from "../controller/auth.controller"
import { verifyJWT } from "../middleware/auth.middlware"

const router = Router()

router.route("/register").post(registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refreshToken").post(refreshAccessToken)

router.route("/change-Password").post(verifyJWT, changePassword)

router.route("/").get(verifyJWT, getLoggedInUserDetails)

export default router
