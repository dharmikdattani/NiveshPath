import Joi from "joi";

const CategoryValidationSchema = Joi.object({
    name: Joi.string()
        .required()
        .trim()
        .messages({
            "any.required": "Category name is required",
            "string.base": "Category name must be a string"
        }),

    description: Joi.string()
        .optional()
        .trim()
        .allow("")
        .messages({
            "string.base": "Description must be a string"
        }),

    type: Joi.string()
        .valid("income", "expense", "investment", "savings")
        .required()
        .messages({
            "any.required": "Type is required",
            "any.only": "Type must be one of [income, expense, investment, savings]"
        }),

    is_default: Joi.boolean()
        .optional()
        .default(false)
        .messages({
            "boolean.base": "is_default must be a boolean"
        }),
});

const UpdateCategoryDetails = CategoryValidationSchema.fork(
    Object.keys(CategoryValidationSchema.describe().keys),
    (schema) => schema.optional()
);

export {
    CategoryValidationSchema, UpdateCategoryDetails
}