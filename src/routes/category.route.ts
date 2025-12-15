import { Router } from "express";
import { addCategory, getDefaultCategory, updateCategory, getCategoryList, deleteCategory } from "../controller/category.controller"
import { verifyJWT } from "../middleware/auth.middlware"

const router = Router()

router.route("/").post(verifyJWT, addCategory)
router.route("/default").get(verifyJWT, getDefaultCategory)
router.route("/").get(verifyJWT, getCategoryList)
router.route("/:id").patch(verifyJWT,updateCategory)
router.route("/:id").delete(verifyJWT, deleteCategory)

export default router
