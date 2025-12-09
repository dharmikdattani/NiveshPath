import { Router } from "express";
import authROuter from "./auth.route"

const router = Router()

router.use("/auth", authROuter)

export default router
