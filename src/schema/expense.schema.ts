import Joi from "joi";

const ExpenseValidationSchema = Joi.object({

    category_id: Joi.string()
        .required()
        .messages({
            "any.required": "Category ID is required",
            "string.base": "Category ID must be a string",
        }),

    amount: Joi.number()
        .precision(2)
        .positive()
        .required()
        .messages({
            "any.required": "Amount is required",
            "number.base": "Amount must be a valid number",
            "number.positive": "Amount must be greater than 0",
            "number.precision": "Amount can have at most 2 decimal places",
        }),

    currency: Joi.string()
        .uppercase()
        .default("INR")
        .messages({
            "string.base": "Currency must be a string",
        }),

    paymentMethod: Joi.string()
        .valid("cash", "card", "upi", "wallet", "bank transfer")
        .default("cash")
        .messages({
            "any.only": "Payment method must be one of [cash, card, upi, wallet]",
        }),

    notes: Joi.string()
        .optional()
        .allow("")
        .trim()
        .messages({
            "string.base": "Notes must be a string",
        }),
});


const ExpenseUpdateSchema = Joi.object({

    category_id: Joi.string()
        .required()
        .messages({
            "any.required": "Category ID is required",
            "string.base": "Category ID must be a string",
        }),

    amount: Joi.number()
        .precision(2)
        .positive()
        .optional()
        .messages({
            "number.base": "Amount must be a valid number",
            "number.positive": "Amount must be greater than 0",
            "number.precision": "Amount can have at most 2 decimal places",
        }),

    currency: Joi.string()
        .uppercase()
        .optional()
        .default("INR")
        .messages({
            "string.base": "Currency must be a string",
        }),

    paymentMethod: Joi.string()
        .valid("cash", "card", "upi", "wallet")
        .optional()
        .default("cash")
        .messages({
            "any.only": "Payment method must be one of [cash, card, upi, wallet]",
        }),

    notes: Joi.string()
        .optional()
        .allow("")
        .trim()
        .messages({
            "string.base": "Notes must be a string",
        }),
});


export { ExpenseValidationSchema, ExpenseUpdateSchema }
