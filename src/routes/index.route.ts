import { Router } from "express";
import authROuter from "./auth.route"
import categoryROuter from "./category.route"

const router = Router()

router.use("/auth", authROuter)
router.use("/category", categoryROuter)

export default router
