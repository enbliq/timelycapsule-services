import Joi from 'joi';

const passwordSchema = Joi.object({
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password should have a minimum length of 6',
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string().min(6).required().valid(Joi.ref('password')).messages({
        'string.min': 'Confirm Password should have a minimum length of 6',
        'string.empty': 'Confirm Password is required',
        'any.required': 'Confirm Password is required',
        'any.only': 'Passwords do not match'
    })
}).options({ stripUnknown: true });

export default passwordSchema;
