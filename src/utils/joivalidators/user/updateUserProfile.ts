import joi from 'joi';

const updateUserProfileSchema = joi
    .object({
        fullName: joi.string().optional().allow(null, ''),
        company: joi.string().optional().allow(null, ''),
        email: joi.string().email().optional().allow(null, ''),
        emailTemplate: joi.string().optional().allow(null, ''),
        password: joi.string().min(6).optional().allow(null, ''),
        email_verification: joi.string().optional().allow(null, ''),
        passwordResetToken: joi.string().optional().allow(null, ''),
        passwordResetExpires: joi.number().optional(),
        isVerified: joi.boolean().optional(),
        isOnBoarded: joi.boolean().optional(),
        companyCategory: joi.string().optional().allow(null, ''),
        companyDescription: joi.string().optional().allow(null, ''),
        companyWebsite: joi.string().optional().allow(null, ''),
        nigpcode: joi.array().optional().allow(null),
        naicscode: joi.array().optional().allow(null),
        certifications: joi.array().optional().allow(null),
        NAICSCode: joi.array().optional().allow(null),
        licenses: joi.array().optional().allow(null),
        previousClients: joi.array().optional().allow(null),
        priorProjects: joi.array().optional().allow(null),
        fileVector: joi.array().optional().allow(null)
    })
    .options({ stripUnknown: true });

export default updateUserProfileSchema;
