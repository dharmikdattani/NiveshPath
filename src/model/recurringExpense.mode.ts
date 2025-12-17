import { Schema, model, Document, Types } from "mongoose";

export interface IRecurringTransaction extends Document {
    user_id: Types.ObjectId;
    category_id: Types.ObjectId;
    title: string;
    amount: Types.Decimal128;
    currency: string;
    type: "income" | "expense";
    frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    startDate: Date;
    nextDueDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const RecurringTransactionSchema = new Schema<IRecurringTransaction>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    category_id: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Schema.Types.Decimal128,
        required: true
    },
    currency: {
        type: String,
        default: "INR"
    },
    type: {
        type: String,
        enum: ["income", "expense"],
        required: true
    },
    frequency: {
        type: String,
        enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    nextDueDate: {
        type: Date,
        required: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
},
    {
        timestamps: true
    }
);

// Pre-save hook: initialize nextDueDate = startDate if not provided
RecurringTransactionSchema.pre("validate", function (next) {
    if (!this.nextDueDate) {
        this.nextDueDate = this.startDate;
    }
    next();
});

export const RecurringTransaction = model<IRecurringTransaction>("RecurringTransaction", RecurringTransactionSchema);
