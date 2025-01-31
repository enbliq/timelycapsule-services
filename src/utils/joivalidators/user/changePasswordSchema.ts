import joi from 'joi';

const changePasswordSchema = joi
    .object({
        currentPassword: joi.string().required().messages({
            'string.empty': 'Current password is required',
            'any.required': 'Current password is required'
        }),
        newPassword: joi
            .string()
            .min(8)
            .required()
            .pattern(new RegExp(/^(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/))
            .messages({
                'string.min': 'Password should have a minimum length of 8',
                'string.empty': 'Password is required',
                'any.required': 'Password is required',
                'string.pattern.base': 'Password must contain at least one number and one special character'
            }),
        confirmPassword: joi.string().min(8).required().valid(joi.ref('newPassword')).messages({
            'string.min': 'Confirm Password should have a minimum length of 8',
            'string.empty': 'Confirm Password is required',
            'any.required': 'Confirm Password is required',
            'any.only': 'Passwords do not match'
        })
    })
    .options({ stripUnknown: true });

export default changePasswordSchema;
