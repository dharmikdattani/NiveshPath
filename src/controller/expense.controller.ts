import { ExpenseValidationSchema, ExpenseUpdateSchema } from "../schema/expense.schema";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { Expense } from "../model/expense.model"
import { User } from "../model/user.model";
import {
    startOfDay, endOfDay, startOfWeek, endOfWeek,
    startOfMonth, endOfMonth, startOfYear, endOfYear,
    parseISO,
    subDays
} from "date-fns";
import mongoose from "mongoose";
import { Category } from "../model/category.model";

const getDateRange = (filterType: string, startDate?: string, endDate?: string) => {
    const now = new Date();

    switch (filterType) {
        case "daily":
            return { start: startOfDay(now), end: endOfDay(now) };
        case "weekly":
            return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
        case "monthly":
            return { start: startOfMonth(now), end: endOfMonth(now) };
        case "yearly":
            return { start: startOfYear(now), end: endOfYear(now) };
        case "custom":
            if (!startDate || !endDate) {
                throw new ApiError(400, "Custom filter requires startDate and endDate");
            }
            const start = startOfDay(parseISO(startDate));
            const end = endOfDay(parseISO(endDate));
            return { start, end };

        default:
            return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    }
};

const addExpense = asyncHandler(async (req, res) => {
    try {
        let userId = req.user?._id

        const { error, value } = ExpenseValidationSchema.validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(400).json({ sucess: false, message: "Bad request", errors: error.details.map(err => err.message) });
        }

        const categoryType = await Category.findById(value.category_id)

        if (!categoryType) throw new ApiError(404, "Category not found")

        value.type = categoryType?.type

        let data = {
            ...value,
            user_id: userId
        }

        const resp = await Expense.create(data);

        return res.status(201).json(
            new ApiResponse(201, "Expense added successfully", resp)
        );
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message, error.errors));
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
})

const updateExpense = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id
        let userId = req.user?._id

        const record = await Expense.findById(id)

        if (!record) throw new ApiError(404, "Record not found")

        const { error, value } = ExpenseUpdateSchema.validate(req.body, { abortEarly: false });

        if (error) {
            return res.status(400).json({ sucess: false, message: "Bad request", errors: error.details.map(err => err.message) });
        }

        const updatedExpense = await Expense.findOneAndUpdate(
            { _id: id, user_id: userId },   // filter
            { $set: value },               // update
            { new: true, runValidators: true }
        );

        if (!updatedExpense) {
            throw new ApiError(404, "Record not found or unauthorized");
        }

        return res.status(201).json(
            new ApiResponse(201, "Expense updated successfully", updatedExpense)
        );
    } catch (error) {
        console.log("error", error)
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message, error.errors));
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
})

const getUserExpenses = asyncHandler(async (req, res) => {
    try {
        const { filterType, startDate, endDate, category_id, amount, minAmount, maxAmount } = req.query;

        const matchStage: any = {
            user_id: req.user?._id,
        };

        if (category_id) {
            matchStage.category_id = new mongoose.Types.ObjectId(category_id as string);
        }

        const dateRange = getDateRange(filterType as string, startDate as string, endDate as string);

        if (dateRange)
            if (dateRange) {
                matchStage.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
            }

        // Amount Filtering (Low, Medium, High)
        if (amount && amount !== "") {
            const amountConditions: any[] = [];

            if (amount === "Low") amountConditions.push({ amount: { $lte: 2000 } });
            if (amount === "Medium") amountConditions.push({ amount: { $gt: 2000, $lte: 10000 } });
            if (amount === "High") amountConditions.push({ amount: { $gt: 10000 } });

            matchStage.$or = amountConditions;
        }

        // Custom Range Filtering (minAmount, maxAmount)
        if (minAmount || maxAmount) {
            matchStage.amount = {};
            if (minAmount) matchStage.amount.$gte = parseFloat(minAmount as string);
            if (maxAmount) matchStage.amount.$lte = parseFloat(maxAmount as string);
        }

        const expenseList = await Expense.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "categories",
                    localField: "category_id",
                    foreignField: "_id",
                    as: "category",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                type: 1,
                                default: 1,
                            }
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true
                }
            },
            { $sort: { createdAt: -1 } }
        ])

        return res.status(201).json(
            new ApiResponse(201, "Expenses fetched successfully", expenseList)
        );
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message, error.errors));
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });

    }
})

const deleteUserExpense = asyncHandler(async (req, res) => {
    try {
        const id = req.params.id

        const record = await Expense.findByIdAndDelete({ _id: id })

        if (!record) throw new ApiError(404, "Expense not found")

        return res.status(201).json(
            new ApiResponse(201, "Expenses deleted successfully", {})
        );
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json(new ApiResponse(error.statusCode, error.message, error.errors));
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
})

export {
    addExpense,
    updateExpense,
    getUserExpenses,
    deleteUserExpense
}