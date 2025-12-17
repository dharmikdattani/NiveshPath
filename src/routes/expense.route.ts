import { Router } from "express";
import { addExpense, updateExpense, getUserExpenses, deleteUserExpense } from "../controller/expense.controller"
import { verifyJWT } from "../middleware/auth.middlware"

const   router = Router()

router.route("/").post(verifyJWT, addExpense)
router.route("/").get(verifyJWT, getUserExpenses)
router.route("/:id").patch(verifyJWT, updateExpense)
router.route("/:id").delete(verifyJWT, deleteUserExpense)

export default router
