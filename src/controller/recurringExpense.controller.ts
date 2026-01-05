import { RecurringTransactionSchema, UpdateRecurringTransactionSchema } from "../schema/recurrigExpense.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { RecurringTransaction } from "../model/recurringExpense.mode"
import { Expense } from "../model/expense.model";

const getRecurringExpenses = asyncHandler(async (req, res) => {

    const data = await RecurringTransaction.find({ user_id: req.user?._id })

    return res
        .status(201)
        .json(
            new ApiResponse(200, "Recurring expenses fetched successfully", data)
        )
})

type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export function calculateNextDueDate(date: Date | string, frequency: RecurrenceFrequency): Date {
    const d = new Date(date);

    switch (frequency) {
        case "DAILY":
            d.setDate(d.getDate() + 1);
            break;
        case "WEEKLY":
            d.setDate(d.getDate() + 7);
            break;
        case "MONTHLY":
            d.setMonth(d.getMonth() + 1);
            break;
        case "YEARLY":
            d.setFullYear(d.getFullYear() + 1);
            break;
    }

    return d;
}

const addRecurringExpense = asyncHandler(async (req, res) => {

    const { error, value } = RecurringTransactionSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            sucess: false,
            message: "Bad request",
            errors: error.details.map(err => err.message)
        });
    }

    value.user_id = req.user?._id;
    const data = await RecurringTransaction.create(value);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const startDate = new Date(data.startDate);
    startDate.setUTCHours(0, 0, 0, 0);

    if (startDate <= today) {

        const alreadyExists = await Expense.findOne({
            recurring_id: data._id,
            occurrenceDate: data.startDate
        });

        if (alreadyExists) {
            console.log(`⚠️ [addRecurringExpense] Expense already exists for recurring_id=${data._id} at ${data.startDate}`);
        } else {
            console.log(`🆕 [addRecurringExpense] Creating first Expense for recurring_id=${data._id}`);

            await Expense.create({
                user_id: req.user._id,
                category_id: value.category_id,
                amount: value.amount,
                currency: value.currency,
                paymentMethod: value.paymentMethod || "cash", // fallback
                type: value.type,
                recurring_id: data._id,
                source: "RECURRING",
                occurrenceDate: data.startDate
            });

            data.nextDueDate = calculateNextDueDate(data.startDate, data.frequency);

            await data.save();
        }
    } else {
        console.log(`⏭️ [addRecurringExpense] Start date is in the future (${data.startDate}), skipping first Expense creation.`);
    }

    return res.status(201).json(
        new ApiResponse(201, "Recurring expense added successfully", data)
    );
});

const updateRecurringExpense = asyncHandler(async (req, res) => {

    const id = req.params.id

    const record = await RecurringTransaction.findById(id);
    if (!record) throw new ApiError(404, "Record not found");

    const { error, value } = UpdateRecurringTransactionSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({ sucess: false, message: "Bad request", errors: error.details.map(err => err.message) });
    }

    value.user_id = req.user?._id

    const updatedRecord = await RecurringTransaction.findByIdAndUpdate(
        id,
        { $set: value },
        { new: true, runValidators: true }
    );

    return res.status(201).json(
        new ApiResponse(201, "Recurring expense updated successfully", updatedRecord)
    );
})

const deleteRecurringExpense = asyncHandler(async (req, res) => {

    const id = req.params.id
    const record = await RecurringTransaction.findOneAndDelete({ _id: id })
    if (!record) throw new ApiError(404, "Record not found")

    return res.status(201).json(
        new ApiResponse(201, "Recurring payment removed successfully", {})
    );
})

export const processRecurringExpenses = async () => {

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    try {
        const transactions = await RecurringTransaction.find({
            nextDueDate: { $gte: startOfDay, $lte: endOfDay },
            isActive: true,
        });

        for (const txn of transactions) {

            const alreadyExists = await Expense.findOne({
                recurring_id: txn._id,
                occurrenceDate: txn.nextDueDate
            });

            if (alreadyExists) {
                console.log(`⚠️ Expense already exists for recurring ID: ${txn._id} on date ${txn.nextDueDate.toISOString()}. Skipping...`);
                continue;
            }

            await Expense.create({
                user_id: txn.user_id,
                category_id: txn.category_id,
                amount: txn.amount,
                currency: txn.currency,
                paymentMethod: "cash",
                type: txn.type,
                recurring_id: txn._id,
                source: "RECURRING",
                occurrenceDate: txn.nextDueDate
            });

            // txn.lastRunDate = txn.nextDueDate;
            txn.nextDueDate = calculateNextDueDate(txn.nextDueDate, txn.frequency);
            await txn.save();
        }

    } catch (error) {
        console.error("❌ Error running recurring expense job:", error);
    }
};

export {
    getRecurringExpenses,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense
}