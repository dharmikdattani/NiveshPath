import { Schema, model, Document, Types } from "mongoose";

export interface IExpense extends Document {
    user_id: Types.ObjectId;
    category_id: Types.ObjectId;
    amount: Types.Decimal128;
    currency?: string;
    paymentMethod: "cash" | "card" | "upi" | "wallet" | "bank transfer";
    type: "income" | "expense" | "investment" | "savings";
    notes?: string;
    recurring_id?: Types.ObjectId;
    source: "MANUAL" | "RECURRING";
    occurrenceDate?: Date;
    createdAt: Date;
    updatedAt: Date;

}

const ExpenseSchema = new Schema<IExpense>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        category_id: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true,
        },
        amount: {
            type: Schema.Types.Decimal128,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
            trim: true,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "card", "upi", "wallet", "bank transfer"],
            default: "cash",
        },
        type: {
            type: String,
            enum: ["income", "expense", "investment", "savings"],
            required: true,
        },
        notes: {
            type: String,
            trim: true,
        },

        // NEW FIELDS
        recurring_id: {
            type: Schema.Types.ObjectId,
            ref: "RecurringTransaction",
            default: null,
            index: true,
        },
        source: {
            type: String,
            enum: ["MANUAL", "RECURRING"],
            default: "MANUAL",
        },
        occurrenceDate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export const Expense = model<IExpense>("Expense", ExpenseSchema);
