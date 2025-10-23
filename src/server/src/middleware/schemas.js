(function () {

    const Joi = require('joi');
    const validateRequest = require('./validate-request');

    module.exports = { authenticateSchema,
        registerSchema,
        forgotPasswordSchema,
        changePasswordSchema,
        deleteUserSchema: deleteUsersSchema,
        userSchema
    };
    // module.exports = register;

    function authenticateSchema(req, res, next) {
        const schema = Joi.object({
            username: Joi.string().required(),
            password: Joi.string().required(),
        });
        validateRequest(req, next, schema);
    }

    function revokeTokenSchema(req, res, next) {
        const schema = Joi.object({
            token: Joi.string().empty('')
        });
        validateRequest(req, next, schema);
    }

    function forgotPasswordSchema(req, res, next) {
        const schema = Joi.object({
            username: Joi.string().required(),
            state: Joi.number().required()
        });
        validateRequest(req, next, schema);
    }

    function changePasswordSchema(req, res, next) {
        const schema = Joi.object({
            username: Joi.string().required(),
            state: Joi.number().required(),
            password: Joi.string().min(6).required(),
            newPassword: Joi.string().min(6).required(),
        });
        validateRequest(req, next, schema);
    }

    function registerSchema(req, res, next) {
        const schema = Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            username: Joi.string().required(),
            password: Joi.string().min(6).required(),
            role: Joi.string().required(),
            state: Joi.number().required(),
            enable: Joi.boolean().required(),
        });
        validateRequest(req, next, schema);
    }

    function userSchema(req, res, next) {
        const schema = Joi.object({
            id: Joi.number().required(),
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            username: Joi.string().required(),
            password: Joi.string().min(6).required(),
            role: Joi.string().required(),
            state: Joi.number().required(),
            enable: Joi.boolean().required(),
        });
        validateRequest(req, next, schema);
    }

    function deleteUsersSchema(req, res, next) {
        const schema = Joi.object({
            ids: Joi.string().required(),
        });
        validateRequest(req, next, schema);
    }

    
}());
