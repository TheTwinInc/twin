(function () {
    const log = require('../utils/log');
    const users = require('../models/usersModel');
  
    module.exports.getUsers = getUsers;
    module.exports.getUser = getUser;
    module.exports.upsertUser = upsertUser;
    module.exports.insertUser = insertUser;
    module.exports.deleteUser = deleteUser;
    module.exports.deleteUsers = deleteUsers;
    module.exports.authenticateUser = authenticateUser;
    module.exports.forgotPassword = forgotPassword;
    module.exports.changePassword = changePassword;

    async function getUsers(req, res) {
        log.info(`UM: Get users...`);
        let result = {};
        try {
            result = await users.getUsers();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getUser(req, res) {
        try {
            const context = {
                'id': req.params.id == undefined ? '' : req.params.id,
            }
            let result;
            result = await users.getUser(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function upsertUser(req, res) {
        try {
            log.debug(`UM: Upsert user: ${JSON.stringify(req.body)}`);
            const context = {
                'id': req.body.id == undefined ? '' : req.body.id,
                'firstName': req.body.firstName == undefined ? '' : req.body.firstName,
                'lastName': req.body.lastName == undefined ? '' : req.body.lastName,
                'username': req.body.username == undefined ? '' : req.body.username,
                'password': req.body.password == undefined ? '' : req.body.password,
                'role': req.body.role == undefined ? '' : req.body.role,
                'state': req.body.state == undefined ? 0 : req.body.state,
                'enable': req.body.enable == undefined ? false : req.body.enable,
            }
            let result;
            result = await users.upsertUser(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function insertUser(req, res) {
        try {
            const context = {
                // 'id': req.body.id == undefined ? '' : req.body.id,
                'firstName': req.body.firstName == undefined ? '' : req.body.firstName,
                'lastName': req.body.lastName == undefined ? '' : req.body.lastName,
                'username': req.body.username == undefined ? '' : req.body.username,
                'password': req.body.password == undefined ? '' : req.body.password,
                'role': req.body.role == undefined ? '' : req.body.role,
                'state': req.body.state == undefined ? 0 : req.body.state,
                'enable': req.body.enable == undefined ? false : req.body.enable,
            }
            let result;
            result = await users.insertUser(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function deleteUser(req, res) {
        try {
            const context = {
                'id': req.params.id == undefined ? '' : req.params.id,
            }
            let result;
            result = await users.deleteUser(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function deleteUsers(req, res) {
        try {
            const context = {
                'id': req.body.ids == undefined ? '' : req.body.ids,
            }
            let result;
            if ('' != context.id){
                result = await users.deleteUsers(context);
                res.status(200).end(JSON.stringify(result));
            } else {
                res.status(404).end();
            }
            
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function authenticateUser(req, res) {
        try {
            let statusCode = 200;
            const context = {
                'username': req.body.username == undefined ? '' : req.body.username,
                'password': req.body.password == undefined ? '' : req.body.password,
            }
            log.info(`UM: Authenticate user: ${JSON.stringify(context)}`);
            let result;
            result = await users.authenticateUser(context);
            if (undefined != result.statusCode) {
                statusCode = result.statusCode;
            }
            res.status(statusCode).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function forgotPassword(req, res) {
        try {
            log.debug(`UM: Forgot password user: ${JSON.stringify(req.body)}`);
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
            log.debug(`UM: Change user password: ${JSON.stringify(req.body)}`);
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