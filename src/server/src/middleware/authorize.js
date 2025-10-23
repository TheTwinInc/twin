(function () {
    const _ = require('lodash');
    const log = require('../utils/log.js');
    // const jwt = require('jsonwebtoken');
    const { expressjwt: jwt } = require('express-jwt');
    // const { expressjwt } = require('express-jwt');
    const env = process.env.NODE_ENV || 'development';
    const secret = require('../config/config')[env].secret;
    const users = require('../models/usersModel.js');
    const account = require('../models/accountModel.js');

    module.exports = authorize;
    // module.exports.verifyToken = verifyToken;

    // const RSA_PRIVATE_KEY = fs.readFileSync('./demos/private.key');

    function authorize(roles = []) {
        if (typeof roles === 'string') {
            roles = [roles];
        }

        return [
            // authenticate JWT token and attach decoded token to request as req.user
            
            // expressjwt({ secret, algorithms: ['HS256'], credentialsRequired: false }),
            // jwt({ secret, algorithms: ['HS256'], onExpired: onExpired, credentialsRequired: false }),
            jwt({ secret, algorithms: ['HS256'], credentialsRequired: false }),
            // async (err, req, res, next) => {
            // function(err, req, res, next){
            //     res.status(401).json(err);
            //     next();
            // },
            // async (err, req, res, next) => {
            async (req, res, next) => {
                // if (err.name === 'UnauthorizedError') {
                //     res.status(401).send('Invalid token...');
                // } else {
                let role;
                let username;
                let userId;
                let user;
                const hasRole = _.has(req.auth, ['role']);
                const hasUsername = _.has(req.auth, ['username']);
                const hasUserId = _.has(req.auth, ['id']);
                // log.debug(`AU: Req.auth: ${JSON.stringify(req.auth)}`);
                if (hasUsername && hasRole && hasUserId) {
                    username = req.auth.username;
                    role = req.auth.role;
                    userId = req.auth.id;

                    user = await users.getUserByUsername({username: username});
                    // log.debug(`AU: User: ${JSON.stringify(user)}`);
                    // log.debug(`AU: Roles: ${JSON.stringify(roles)}`);
                    // log.debug(`AU: Role: ${JSON.stringify(role)}`);

                    if (!user || (roles.length && !roles.includes(role))) {
                        // user no longer exists or role not authorized
                        return res.status(401).json({ message: 'Unauthorized User' });
                    }
                } else {
                    return res.status(401).json({ message: 'Unauthorized No role' });
                }
                // }
                
                
                //TODO check refershToken in Body
                // authentication and authorization successful
                // const refreshTokens = await account.findRefreshTokenByUserId({ userId: userId });
                // req.user.ownsToken = token => !!refreshTokens.find(x => x.token === token);
                next();
            }
        ];
    }

    // async function onExpired (req, err, next, err) {
    //     return res.status(401).json({ message: 'Token expired' });
    // }
    // async function onExpired (req, err) {
    //     // if (new Date() - err.inner.expiredAt < 5000) { return;}
    //     throw err;
    // }
}());
