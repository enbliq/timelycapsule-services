import Joi from 'joi';

const updateUserProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'string.empty': 'First name cannot be empty',
  }),
  lastName: Joi.string().min(2).max(50).messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'string.empty': 'Last name cannot be empty',
  }),
  walletAddress: Joi.string().allow(null, '').messages({
    'string.base': 'Wallet address must be a string',
  }),
})
  .min(1)
  .options({ stripUnknown: true });

export default updateUserProfileSchema;
