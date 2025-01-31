import Joi from 'joi';

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Invalid email',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
    })
}).options({ stripUnknown: true });

export default forgotPasswordSchema;
