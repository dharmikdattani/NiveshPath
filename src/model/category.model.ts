import { Schema, model, Document, Types } from "mongoose";
import { User } from "./user.model";

export interface ICategory extends Document {
    user_id: Types.ObjectId;
    name: string;
    description?: string;
    type: "income" | "expense" | "investment" | "savings";
    is_default: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: User
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: false,
            trim: true,
        },
        type: {
            type: String,
            enum: ["income", "expense", "investment", "savings"],
            required: true,
        },
        is_default: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true
    }
);

export const Category = model<ICategory>("Category", CategorySchema);
