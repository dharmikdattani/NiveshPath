import Joi from "joi";

const RecurringTransactionSchema = Joi.object({

    category_id: Joi.string()
        .required()
        .messages({
            "any.required": "category_id is required",
            "string.base": "category_id must be a string",
            "string.pattern.base": "category_id must be a valid ObjectId"
        }),

    title: Joi.string()
        .trim()
        .required()
        .messages({
            "any.required": "title is required",
            "string.empty": "title cannot be empty"
        }),

    amount: Joi.number()
        .precision(2)
        .required()
        .messages({
            "any.required": "amount is required",
            "number.base": "amount must be a valid number",
            "number.precision": "amount can have a maximum of 2 decimal places"
        }),

    currency: Joi.string()
        .default("INR")
        .messages({
            "string.base": "currency must be a string"
        }),

    type: Joi.string()
        .valid("income", "expense")
        .required()
        .messages({
            "any.required": "type is required",
            "any.only": "type must be either 'income' or 'expense'"
        }),

    frequency: Joi.string()
        .valid("DAILY", "WEEKLY", "MONTHLY", "YEARLY")
        .required()
        .messages({
            "any.required": "frequency is required",
            "any.only": "frequency must be one of 'DAILY', 'WEEKLY', 'MONTHLY', or 'YEARLY'"
        }),

    startDate: Joi.date()
        .required()
        .messages({
            "any.required": "startDate is required",
            "date.base": "startDate must be a valid date"
        }),

    nextDueDate: Joi.date()
        .required()
        .messages({
            "any.required": "nextDueDate is required",
            "date.base": "nextDueDate must be a valid date"
        }),

    isActive: Joi.boolean()
        .default(true)
        .messages({
            "boolean.base": "isActive must be a boolean"
        }),

    lastRunDate: Joi.date()
        .allow(null)
        .messages({
            "date.base": "lastRunDate must be a valid date or null"
        }),
});

const UpdateRecurringTransactionSchema = Joi.object({

    category_id: Joi.string()
        .required()
        .messages({
            "any.required": "category_id is required",
            "string.base": "category_id must be a string",
            "string.pattern.base": "category_id must be a valid ObjectId"
        }),

    title: Joi.string()
        .trim()
        .optional()
        .messages({
            "string.empty": "title cannot be empty"
        }),

    amount: Joi.number()
        .precision(2)
        .optional()
        .messages({
            "number.precision": "amount can have a maximum of 2 decimal places"
        }),

    currency: Joi.string()
        .default("INR")
        .messages({
            "string.base": "currency must be a string"
        }),

    type: Joi.string()
        .valid("income", "expense")
        .required()
        .messages({
            "any.required": "type is required",
            "any.only": "type must be either 'income' or 'expense'"
        }),

    frequency: Joi.string()
        .valid("DAILY", "WEEKLY", "MONTHLY", "YEARLY")
        .messages({
            "any.only": "frequency must be one of 'DAILY', 'WEEKLY', 'MONTHLY', or 'YEARLY'"
        }),

    startDate: Joi.date()
        .messages({
            "date.base": "startDate must be a valid date"
        }),

    nextDueDate: Joi.date()
        .messages({
            "date.base": "nextDueDate must be a valid date"
        }),

    isActive: Joi.boolean()
        .default(true)
        .messages({
            "boolean.base": "isActive must be a boolean"
        }),

    lastRunDate: Joi.date()
        .allow(null)
        .messages({
            "date.base": "lastRunDate must be a valid date or null"
        }),
});

export { RecurringTransactionSchema, UpdateRecurringTransactionSchema };
