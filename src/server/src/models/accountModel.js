(function () {
    const _ = require('lodash');
    const database = require('../persistence/databasePostgres.js');
    const log = require('../utils/log.js');
    const utils = require('../utils/utils.js');
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcryptjs');
    const crypto = require('crypto');
    const { formatISO, addDays } = require("date-fns");
    const users = require('./usersModel.js');

    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config.js')[env];

    module.exports.authenticateUser = authenticateUser;
    module.exports.getRefreshTokens = getRefreshToken;
    module.exports.getRefreshTokenByUserId = getRefreshTokenByUserId;
    module.exports.upsertRefreshToken = upsertRefreshToken;
    // module.exports.generateJwtToken = generateJwtToken;
    // module.exports.generateRefreshToken = generateRefreshToken;
    module.exports.refreshToken = refreshToken;
    module.exports.revokeToken = revokeToken;

    async function authenticateUser(user) {
        let result = {};
        
        try {
            let passwordProp = 'password';
            let password = utils.extractPassword(user, passwordProp);
            let userData = await users.getUserByUsername(user);
            // log.debug(`UM: Authenticate user: ${JSON.stringify(userData)}`);
            if (undefined != userData) {
                let passwordMatch = utils.verifyPassword(userData, password);
                // let passwordMatch = await verifyPassword(userData, password);
                if (passwordMatch) {
                    // log.debug(`UM: Password match: ${JSON.stringify(passwordMatch)}`);
                    const jwtToken = generateJwtToken(userData);
                    userData['token'] = jwtToken;
                    const refreshToken = await generateRefreshToken(userData);
                    userData['refreshToken'] = refreshToken.token;
                    await upsertRefreshToken(refreshToken);
                    result = userData;
                } else {
                    result = {
                        statusCode: 200,
                        error: 'Username or password is incorrect.',
                    };
                }
            }
        } catch(error) {
            log.error(`UM: Error: ${error}`);
            result = {
                statusCode: 404,
                error: 'Unable to authenticate user.',
            };
        }
        return result;
    }

    async function refreshToken(context) {
        let result = {};
        
        try {
            token = context.refreshToken;
            const refreshToken = await getRefreshToken({token: token});
            
            if (undefined != refreshToken){
                // log.debug(`AM: Refresh token: ${JSON.stringify(refreshToken)}`);
                const response = await users.getUser({id: refreshToken.userId});
                if (undefined != response && !response.statusCode) {
                    const user = response;
                    // log.debug(`AM: Refresh user: ${JSON.stringify(user)}`);
                    // replace old refresh token with a new one and save
                    const newRefreshToken = await generateRefreshToken(user);
                    refreshToken.revoked = Date.now();
                    refreshToken.replacedByToken = newRefreshToken.token;
                    // log.debug(`AM: New refresh token: ${JSON.stringify(newRefreshToken)}`);
                    await upsertRefreshToken(refreshToken);
                    await upsertRefreshToken(newRefreshToken);
                
                    // generate new jwt
                    const jwtToken = generateJwtToken(user);
                    user['token'] = jwtToken;
                    user['refreshToken'] = newRefreshToken.token;
                    return user;
                }
            } else {
                result = {
                    statusCode: 401,
                    error: 'UM: Unauthorized.',
                };
            }
        } catch(error) {
            log.error(`UM: Error: ${error}`);
            result = {
                statusCode: 404,
                error: 'Unauthorized, unable to refresh token.',
            };
        }
        return result;
    }

    async function revokeToken(context) {
        let result = {};
        
        try {
            token = context.refreshToken;
            const refreshToken = await getRefreshToken({token: token});
            
            if (undefined != refreshToken){
                    refreshToken.revokedAt = formatISO(Date.now());
                    await upsertRefreshToken(refreshToken);
                    result = refreshToken;
            } else {
                result = {
                    statusCode: 401,
                    error: 'UM: Refresh token not found.',
                };
            }
        } catch(error) {
            log.error(`UM: Error: ${error}`);
            result = {
                statusCode: 404,
                error: 'Unauthorized, unable to revoke token.',
            };
        }
        return result;
    }

    async function getRefreshToken(token) {
        let result = {};
        let tokenData = {};

        try {
            let returningColumns = ['userId', 'token', 'expires'];

            const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

            let primaryColumn = 'token';
            let primaryColumnValue;
            let characterColumns = ['token'];

            if (characterColumns.includes(primaryColumn)) {
                primaryColumnValue = `'${token[primaryColumn]}'`;
            } else {
                primaryColumnValue = token[primaryColumn];
            }
                    
            const query = {
                text: `SELECT ${returningQueryValues} FROM tokens WHERE ${primaryColumn} = ${primaryColumnValue}`,
            };
            // log.debug(`UM: Get token query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            // log.debug(`UM: Get token data: ${JSON.stringify(data)}`);
            if (undefined != data) {
                tokenData = utils.camelizeKeys(data[0]);
                tokenData.expires = formatISO(tokenData.expires);
            }
            // log.debug(`UM: Get token after: ${JSON.stringify(tokenData)}`);
            result = tokenData;
        } catch(error) {
            log.error(`UM: Error: ${error}`);
            result = {
                statusCode: 400,
                error: 'UM: Unable to read token.',
            };
        }
        return result;
    }

    async function getRefreshTokenByUserId(user) {
        let result = {};
        let tokenData = {};

        try {
            let returningColumns = ['userId', 'token', 'expires'];

            const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

            let primaryColumn = 'userId';
            let primaryColumnValue;
            let characterColumns = [];

            if (characterColumns.includes(primaryColumn)) {
                primaryColumnValue = `'${token[primaryColumn]}'`;
            } else {
                primaryColumnValue = token[primaryColumn];
            }
                    
            const query = {
                text: `SELECT ${returningQueryValues} FROM tokens WHERE ${primaryColumn} = ${primaryColumnValue}`,
            };
            log.debug(`UM: Get token query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            log.debug(`UM: Get token data: ${JSON.stringify(data)}`);
            if (undefined != data) {
                tokenData = data;
            }
            log.debug(`UM: Get token after: ${JSON.stringify(tokenData)}`);
            result = tokenData;
        } catch(error) {
            log.error(`UM: Error: ${error}`);
            result = {
                statusCode: 400,
                error: 'UM: Unable to read token.',
            };
        }
        return result;
    }

    async function upsertRefreshToken(token) {
        let result = {};
        // log.debug(`AM: Upsert refresh token : ${JSON.stringify(token)}`);
        try {
            if (undefined != token.userId) {
                let insertProps = [];
                let insertValues = [];
                let updateProps = [];
                let updateStatement = 'DO NOTHING';
                let acceptedColumns = ['userId', 'token', 'expires', 'createdAt', 'revokedAt', 'replacedByToken'];
                let characterColumns = ['token', 'expires', 'createdAt', 'revokedAt', 'replacedByToken'];
                let conflictColumns = ['userId', 'token'];
                let updateColumns = ['revokedAt', 'replacedByToken'];
                let returningColumns = ['userId', 'token', 'expires'];

                for (const prop in token) {
                    if ((acceptedColumns.includes(prop))) {
                        insertProps.push(`${_.snakeCase(prop)}`);
                        
                        if (characterColumns.includes(prop)) {
                            insertValues.push(`'${token[prop]}'`);
                        } else {
                            insertValues.push(token[prop]);
                        }
                        
                        if (updateColumns.includes(prop)) {
                            updateProps.push(`${_.snakeCase(prop)} = EXCLUDED.${_.snakeCase(prop)}`);
                        }
                    }
                }

                const insertQueryColumns = insertProps.join();
                const insertQueryValues = insertValues.join();
                const conflictColumnsValues = conflictColumns.map(x => _.snakeCase(x)).join();
                const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

                if ('' != updateProps) {
                    updateStatement = 'DO UPDATE SET';
                }

                const query = {
                    text: `INSERT INTO tokens (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) ${updateStatement} ${updateProps} RETURNING ${returningQueryValues}`,
                };
                // log.debug(`AM: Upsert refresh token query: ${JSON.stringify(query)}`);
                const resultQuery = await database.execute(query);
                const data = resultQuery.rows;
                if (undefined != data) {
                    result = utils.camelizeKeys(data[0]);
                }
            } else {
                utils.throwError('Undefined user in token');
            }
        } catch (err) {
            log.error(err);
            result = {
                statusCode: 400,
                error: 'AM: Unable to upsert token.',
            };
        }
        return result;
    }

    function generateJwtToken(userData) {
        let secret = config.secret;
        let payload = {
            id: userData.id,
            username: userData.username,
            role: userData.role 
        };
        const token = jwt.sign(payload, secret, { expiresIn: '15m' });
        delete userData['hash'];
        
        return token;
    }

    async function generateRefreshToken(user) {
        // create a refresh token that expires in 7 days
        let token = randomTokenString();
        let refreshToken = {
            userId : user.id,
            token : token,
            expires : formatISO(addDays(new Date(), 7))
        };
        
        return refreshToken;
    }

    function randomTokenString() {
        return crypto.randomBytes(40).toString('hex');
    }

    function unauthorized() {
        return throwError(() => ({ status: 401, error: { message: 'Unauthorized' } }));
    }

    // async function validateResetToken(token) {
    //     const account = await db.Account.findOne({
    //         'resetToken.token': token,
    //         'resetToken.expires': { $gt: Date.now() }
    //     });
        
    //     if (!account) throw 'Invalid token';
    // }

    // async function refreshToken(context) {
    //     const token = context.refreshToken;
    //     log.info(`AM: Refresh token: ${JSON.stringify(token)}`);
    //     // if (undefined != token) {
            
    //     // }
    //     const refreshToken = await getRefreshTokens(token);
    //     const { account } = refreshToken;
        
    
    //     // replace old refresh token with a new one and save
    //     const newRefreshToken = generateRefreshToken(account);
    //     refreshToken.revoked = Date.now();
    //     // refreshToken.revokedByIp = ipAddress;
    //     refreshToken.replacedByToken = newRefreshToken.token;
    //     await upsertRefreshToken(refreshToken);
    //     await upsertRefreshToken(newRefreshToken);
    //     // await refreshToken.save();
    //     // await newRefreshToken.save();
    
    //     // generate new jwt
    //     const jwtToken = generateJwtToken(account);
    
    //     // return basic details and tokens
    //     return { 
    //         ...basicDetails(account),
    //         jwtToken,
    //         refreshToken: newRefreshToken.token
    //     };
    // }
    
    // async function revokeToken({ token, ipAddress }) {
    //     const refreshToken = await getRefreshTokens(token);
    
    //     // revoke token and save
    //     refreshToken.revoked = Date.now();
    //     refreshToken.revokedByIp = ipAddress;
    //     await refreshToken.save();
    // }

    // verifyToken = (req, res, next) => {
    //     let token = req.headers["x-access-token"];
      
    //     if (!token) {
    //       return res.status(403).send({
    //         message: "No token provided!"
    //       });
    //     }
      
    //     jwt.verify(token,
    //               config.secret,
    //               (err, decoded) => {
    //                 if (err) {
    //                   return res.status(401).send({
    //                     message: "Unauthorized!",
    //                   });
    //                 }
    //                 req.userId = decoded.id;
    //                 next();
    //               });
    // };

    function hash(password) {
        return bcrypt.hashSync(password, 10);
    }

    function isRefreshTokenExpired() {
        return Date.now() >= this.expires;
    }
    
    function isRefreshTokenActive() {
        return !this.revoked && !this.isExpired;
    }
})();