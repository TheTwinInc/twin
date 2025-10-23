(function () {
    const log = require('../utils/log');
    const utils = require('../utils/utils.js');
    const account = require('../models/accountModel');
  
    
    module.exports.authenticateUser = authenticateUser;
    module.exports.refreshToken = refreshToken;
    module.exports.revokeToken = revokeToken;
    
    async function authenticateUser(req, res) {
        try {
            let statusCode = 200;
            const context = {
                'username': req.body.username == undefined ? '' : req.body.username,
                'password': req.body.password == undefined ? '' : req.body.password,
            }
            let result;
            result = await account.authenticateUser(context);
            if (undefined != result.statusCode) {
                statusCode = result.statusCode;
            }
            res.status(statusCode).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function refreshToken(req, res) {
        try {
            let statusCode = 200;
            const context = {
                'refreshToken': req.body.refreshToken == undefined ? '' : req.body.refreshToken,
            }
            // log.debug(`AC: Refresh token: ${JSON.stringify(context)}`);
            let result;
            if ('' != context.refreshToken) {
                result = await account.refreshToken(context);
                if (undefined != result.statusCode) {
                    statusCode = result.statusCode;
                }
            } else {
                utils.throwError('Undefined refresh token.')
            }
            res.status(statusCode).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function revokeToken(req, res) {
        try {
            let statusCode = 200;
            const context = {
                'refreshToken': req.body.refreshToken == undefined ? '' : req.body.refreshToken,
            }
            // log.debug(`AC: Revoke token: ${JSON.stringify(context)}`);
            let result;
            if ('' != context.refreshToken) {
                result = await account.revokeToken(context);
                if (undefined != result.statusCode) {
                    statusCode = result.statusCode;
                }
            } else {
                // throw new Error('Undefined refresh token.');
                utils.throwError('Undefined refresh token.');
            }
            
            res.status(statusCode).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function forgotPassword(req, res) {
        try {
            log.debug(`AC: Forgot password user: ${JSON.stringify(req.body)}`);
            const context = {
                'username': req.body.username == undefined ? '' : req.body.username,
                'state': req.body.state == undefined ? 0 : req.body.state,
            }
            let result;
            result = await users.updateUser(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function changePassword(req, res) {
        try {
            log.debug(`AC: Change user password: ${JSON.stringify(req.body)}`);
            const context = {
                'username': req.body.username == undefined ? '' : req.body.username,
                'state': req.body.state == undefined ? '' : req.body.state,
                'password': req.body.password == undefined ? '' : req.body.password,
                'newPassword': req.body.newPassword == undefined ? '' : req.body.newPassword,
            }
            let result;
            if ('' != context.username && '' != context.password || '' != context.newPassword) {
                result = await users.updateUserPassword(context);
                res.status(200).end(JSON.stringify(result));
            } else {
                res.status(401).end();
            }
            
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }
})();