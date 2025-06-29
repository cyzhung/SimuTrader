const Joi = require('joi');

const validateRequest = (data, schema) => {
    // 創建驗證規則
    const validationSchema = Joi.object({
        email: schema.email && Joi.string().email().required(),
        password: schema.password && Joi.string().min(8).required(),
        // ... 其他字段的驗證規則
    }).required();

    // 執行驗證
    return validationSchema.validate(data, { abortEarly: false });
};

module.exports = { validateRequest };