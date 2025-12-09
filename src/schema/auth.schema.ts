import Joi from 'joi';

// Joi schema for validating User
const userSchema = Joi.object({
    fullName: Joi.string()
        .trim()
        .required()
        .messages({
            'string.base': 'Full name must be a string',
            'string.empty': 'Full name is required',
            'any.required': 'Full name is required',
        }),

    email: Joi.string()
        .email({ tlds: { allow: false } })
        .lowercase()
        .required()
        .messages({
            'string.base': 'Email must be a string',
            'string.email': 'Email must be a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required',
        }),

    password: Joi.string()
        .required()
        .messages({
            'string.base': 'Password must be a string',
            'string.empty': 'Password is required',
            'any.required': 'Password is required',
        }),

    phoneNumber: Joi.number()
        .allow(null, '')
        .messages({
            'string.base': 'Phone number must be a string',
        }),

    currency: Joi.string()
        .default('INR')
        .messages({
            'string.base': 'Currency must be a string',
        }),

    lastLogin: Joi.date()
        .allow(null) // Optional field
        .messages({
            'date.base': 'Last login must be a valid date',
        }),
});

const loginValidationSchema = Joi.object({
    email: Joi.string().required().messages({
        'string.string': 'Email must be a valid format',
        'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required',
    }),
})

const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().required().min(6).messages({
        'string.string': 'Old password must be a valid format',
        'any.required': 'Old password is required',
        'string.min': 'Old password must be at least 6 characters',
    }),
    newPassword: Joi.string().required().min(6).messages({
        'string.string': 'New password must be a valid format',
        'any.required': 'New password is required',
        'string.min': 'New password must be at least 6 characters',
    }),
})

export { userSchema, loginValidationSchema, changePasswordSchema };