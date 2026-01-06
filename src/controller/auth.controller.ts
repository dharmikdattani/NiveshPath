import { userSchema, loginValidationSchema, changePasswordSchema, forgotPasswordSchema } from "../schema/auth.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { User } from "../model/user.model"
import jwt, { JwtPayload } from "jsonwebtoken"
import crypto from "crypto";
import { sendEmail } from "../utils/nodeMailer";

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

    await sendEmail({
        to: user.email,
        subject: "Welcome to NiveshPath 🎉",
        body: welcomeEmailTemplate(user.fullName)
    });

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

const forgotPassword = asyncHandler(async (req, res) => {

    const { error, value } = forgotPasswordSchema.validate(req.body, { abortEarly: false })

    if (error) {
        return res.status(400).json({ sucess: false, message: "Bad request", errors: error.details.map(err => err.message) });
    }

    const user = await User.findOne({ email: value.email })
    if (!user) throw new ApiError(404, "User not found")

    // Generate a random 4-digit OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Hash the OTP using SHA-256 for security
    const tokenHash = crypto.createHash("sha256").update(code).digest("hex");

    user.emailOtp = tokenHash;
    user.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.emailOtpVerified = false;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
        to: user.email,
        subject: "Password Reset Code",
        body: otpEmailTemplate(user.fullName, code)
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, "OTP sent successfully", {}))
})

const verifyPasswordOTP = asyncHandler(async (req, res) => {
    const { otp, email } = req.body;

    if (!otp || !email) {
        throw new ApiError(400, "OTP and email are required");
    }

    const user = await User.findOne({ email });
    if (!user || !user.emailOtp || !user.emailOtpExpiry) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    if (user.emailOtpExpiry < new Date()) {
        throw new ApiError(400, "OTP expired");
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    if (user.emailOtp !== hashedOtp) {
        throw new ApiError(400, "Invalid OTP");
    }

    // Generate short-lived reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Clear OTP
    user.emailOtp = null;
    user.emailOtpExpiry = null;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, "OTP verified", { resetToken })
    );
});

const resetPassword = asyncHandler(async (req, res) => {
    const { newPassword, resetToken } = req.body;

    if (!newPassword || !resetToken) {
        throw new ApiError(400, "New password and reset token are required");
    }

    const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    const user = await User.findOne({
        passwordResetToken: resetTokenHash,
        passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired reset token");
    }

    user.password = newPassword;

    // Clear reset data
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, "Password reset successfully", {}));
});

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

const welcomeEmailTemplate = (firstName: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Welcome to NiveshPath 🎉</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif; color:#333;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:30px 0;">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1e3a8a; padding:24px; text-align:center;">
              <h1 style="margin:0; font-size:24px; color:#ffffff;">
                Welcome to NiveshPath 🎉
              </h1>
              <p style="margin:10px 0 0; font-size:14px; color:#c7d2fe; line-height:1.5;">
                Smart spending is the first step on your NiveshPath —
                <br />
                track expenses today to enable investments tomorrow.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 14px; font-size:16px;">
                Hello ${firstName || "there"},
              </p>

              <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#555;">
                Congratulations and welcome to <strong>NiveshPath</strong> 🎉  
                Smart spending is the foundation of financial freedom — and you’ve just taken
                the first step by joining us.
              </p>

              <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#555;">
                By tracking your expenses today, you’re preparing yourself to make
                <strong>confident investment decisions tomorrow</strong>.
                NiveshPath helps you stay aware, disciplined, and in control of your money.
              </p>

              <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#555;">
                With NiveshPath, you can:
              </p>

              <ul style="margin:0 0 18px; padding-left:20px; color:#555; font-size:15px; line-height:1.6;">
                <li>📊 Track your daily expenses effortlessly</li>
                <li>💡 Understand exactly where your money goes</li>
                <li>🎯 Build better habits that lead to smarter investments</li>
              </ul>

              <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#555;">
                Start by adding your first expense today — small, consistent actions create
                powerful long-term results.
              </p>

              <!-- CTA -->
              <div style="text-align:center; margin:30px 0;">
                <span style="
                  display:inline-block;
                  padding:14px 26px;
                  font-size:15px;
                  font-weight:bold;
                  color:#ffffff;
                  background-color:#1e3a8a;
                  border-radius:6px;
                ">
                  Start Your NiveshPath 💸
                </span>
              </div>

              <p style="margin:0; font-size:14px; color:#555;">
                We’re excited to be part of your financial journey.
              </p>

              <p style="margin:12px 0 0; font-size:14px; color:#555;">
                Happy tracking,<br />
                <strong>Team NiveshPath</strong>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 30px;">
              <hr style="border:none; border-top:1px solid #e5e7eb;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} NiveshPath. All rights reserved.
              </p>
              <p style="margin:6px 0 0; font-size:12px; color:#9ca3af;">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

const otpEmailTemplate = (firstName: string, code: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>NiveshPath | Password Reset Code</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif; color:#333;">
  
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:30px 0;">
    <tr>
      <td align="center">
        
        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background-color:#1e3a8a; padding:20px; text-align:center;">
              <h1 style="margin:0; font-size:22px; color:#ffffff; letter-spacing:0.5px;">
                NiveshPath
              </h1>
              <p style="margin:5px 0 0; font-size:13px; color:#c7d2fe;">
                Track • Manage • Understand Your Expenses
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px;">
              <p style="margin:0 0 12px; font-size:16px;">
                Hello ${firstName || "User"},
              </p>

              <p style="margin:0 0 18px; font-size:15px; line-height:1.6; color:#555;">
                We received a request to reset your <strong>NiveshPath</strong> account password.
                Please use the verification code below to continue.
              </p>

              <!-- OTP Box -->
              <div style="text-align:center; margin:25px 0;">
                <span style="
                  display:inline-block;
                  padding:14px 28px;
                  font-size:26px;
                  font-weight:bold;
                  letter-spacing:4px;
                  color:#1e3a8a;
                  background-color:#eef2ff;
                  border-radius:8px;
                ">
                  ${code}
                </span>
              </div>

              <p style="margin:0 0 10px; font-size:14px; color:#555;">
                ⏳ This code will expire in <strong>10 minutes</strong>.
              </p>

              <p style="margin:0; font-size:14px; color:#555;">
                If you did not request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 30px;">
              <hr style="border:none; border-top:1px solid #e5e7eb;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} NiveshPath. All rights reserved.
              </p>
              <p style="margin:6px 0 0; font-size:12px; color:#9ca3af;">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getLoggedInUserDetails,
    forgotPassword,
    verifyPasswordOTP,
    resetPassword
}