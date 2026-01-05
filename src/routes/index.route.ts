import { Router } from "express";
import authROuter from "./auth.route"
import categoryROuter from "./category.route"
import expenseRouter from "./expense.route"
import recurringExpenseRouter from "./recurringExpense.route"

const router = Router()

router.use("/auth", authROuter)
router.use("/category", categoryROuter)
router.use("/expense", expenseRouter)
router.use("/recurring-expense", recurringExpenseRouter)

export default router
