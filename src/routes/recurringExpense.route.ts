import { Router } from "express";
import { getRecurringExpenses, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense } from "../controller/recurringExpense.controller"
import { verifyJWT } from "../middleware/auth.middlware"

const router = Router()

router.route("/").post(verifyJWT, addRecurringExpense)
router.route("/").get(verifyJWT, getRecurringExpenses)
router.route("/:id").patch(verifyJWT, updateRecurringExpense)
router.route("/:id").delete(verifyJWT, deleteRecurringExpense)

export default router
