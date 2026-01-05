import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError"
import { ApiResponse } from "../utils/ApiResponse"
import { Expense } from "../model/expense.model"
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
            const start = startOfDay(parseISO(startDate)); // "2025-08-25" -> 2025-08-25T00:00:00.000Z
            const end = endOfDay(parseISO(endDate));       // "2025-08-25" -> 2025-08-25T23:59:59.999Z
            return { start, end };

        default:
            return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    }
};


const getUserExpenses = asyncHandler(async (req, res) => {

    const { filterType, startDate, endDate, category_id, amount, minAmount, maxAmount } = req.query;

    const matchStage: any = {
        user_id: req.user?._id,
    };

    // Category filtering
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
                preserveNullAndEmptyArrays: true // If you still want to include expenses without a category
            }
        },
        { $sort: { createdAt: -1 } }
    ])

    return res.status(201).json(
        new ApiResponse(201, "Expenses fetched successfully", expenseList)
    );
})

const homePageDetails = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const today = new Date();

    const dashboardData = await Expense.aggregate([
        { $match: { user_id: userId } },

        {
            $facet: {
                // 1. KPIs
                kpis: [
                    {
                        $group: {
                            _id: "$type",
                            totalAmount: { $sum: "$amount" }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            totalIncome: {
                                $sum: {
                                    $cond: [{ $eq: ["$_id", "income"] }, "$totalAmount", 0]
                                }
                            },
                            totalExpense: {
                                $sum: {
                                    $cond: [{ $eq: ["$_id", "expense"] }, "$totalAmount", 0]
                                }
                            },
                            totalInvestment: {
                                $sum: {
                                    $cond: [{ $eq: ["$_id", "investment"] }, "$totalAmount", 0]
                                }
                            },
                            totalSavings: {
                                $sum: {
                                    $cond: [{ $eq: ["$_id", "savings"] }, "$totalAmount", 0]
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            totalIncome: 1,
                            totalExpense: 1,
                            totalInvestment: 1,
                            totalSavings: 1,
                            totalBalance: { $subtract: ["$totalIncome", "$totalExpense"] }
                        }
                    }
                ],

                // 2. Expense Breakdown by Category & Type (Current Month)
                expenseBreakdownByCategory: [
                    { $match: { createdAt: { $gte: startOfMonth, $lte: today }, type: "expense" } },
                    {
                        $group: {
                            _id: "$category_id",
                            totalAmount: { $sum: "$amount" }
                        }
                    },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "_id",
                            foreignField: "_id",
                            as: "category"
                        }
                    },
                    { $unwind: "$category" },
                    {
                        $project: {
                            _id: 0,
                            category_id: "$_id",
                            name: "$category.name",
                            type: "$category.type",
                            totalAmount: 1
                        }
                    },
                    { $sort: { totalAmount: -1 } }
                ],

                // 3. Monthly Expenses (Last 6 Months)
                monthlyExpenses: [
                    {
                        $group: {
                            _id: {
                                year: { $year: "$createdAt" },
                                month: { $month: "$createdAt" },
                                type: "$type"
                            },
                            totalAmount: { $sum: "$amount" }
                        }
                    },
                    {
                        $group: {
                            _id: { year: "$_id.year", month: "$_id.month" },
                            expenses: {
                                $sum: {
                                    $cond: [{ $eq: ["$_id.type", "expense"] }, "$totalAmount", 0]
                                }
                            },
                            income: {
                                $sum: {
                                    $cond: [{ $eq: ["$_id.type", "income"] }, "$totalAmount", 0]
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            month: {
                                $concat: [
                                    { $toString: "$_id.year" },
                                    "-",
                                    { $toString: "$_id.month" }
                                ]
                            },
                            income: 1,
                            expenses: 1
                        }
                    },
                    { $sort: { month: 1 } },
                    { $limit: 6 }
                ],

                // 4. Daily Spending (Current Month)
                dailySpending: [
                    { $match: { createdAt: { $gte: startOfMonth, $lte: today }, type: "expense" } },
                    {
                        $group: {
                            _id: { day: { $dayOfMonth: "$createdAt" } },
                            amount: { $sum: "$amount" }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            date: { $concat: [{ $toString: "$_id.day" }, "-", { $toString: (new Date().getMonth() + 1) }] },
                            amount: 1
                        }
                    },
                    { $sort: { date: 1 } }
                ],

                // 5. Recent Transactions
                recentExpenses: [
                    { $sort: { createdAt: -1 } },
                    { $limit: 5 },
                    {
                        $lookup: {
                            from: "categories",
                            localField: "category_id",
                            foreignField: "_id",
                            as: "category"
                        }
                    },
                    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
                    {
                        $project: {
                            _id: 1,
                            amount: 1,
                            category: { _id: "$category._id", name: "$category.name", type: "$category.type" },
                            paymentMethod: 1,
                            notes: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, "Dashboard data fetched successfully", dashboardData[0])
    );
});


export {
    getUserExpenses,
    homePageDetails
}