import cron from "node-cron";
import { processRecurringExpenses } from "../controller/recurringExpense.controller";

export const startRecurringExpenseJobs = () => {

    // Immediate execution on server start
    processRecurringExpenses();

    // Run at midnight too
    cron.schedule("0 0 * * *", () => {
        processRecurringExpenses();
    });
};
