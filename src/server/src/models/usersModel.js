const { result } = require('lodash');

(function () {
    const _ = require('lodash');
    const database = require('../persistence/databasePostgres.js');
    const log = require('../utils/log.js');
    const utils = require('../utils/utils.js');
    const jwt = require('jsonwebtoken');
    
    const crypto = require('crypto');
    const account = require('./accountModel.js');
    

    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config.js')[env];

    module.exports.getUser = getUser;
    module.exports.getUserByUsername = getUserByUsername;
    module.exports.getUsers = getUsers;
    module.exports.upsertUser = upsertUser;
    module.exports.insertUser = insertUser;
    module.exports.deleteUser = deleteUser;
    module.exports.deleteUsers = deleteUsers;
    module.exports.updateUser = updateUser;
    module.exports.updateUserPassword = updateUserPassword;

    async function getUsers() {
        let result = {};
        let users = [];
        
        try {
            let returningColumns = ['id', 'firstName', 'lastName', 'username', 'role', 'enable', 'state'];

            const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

            const query = {
                text: `SELECT ${returningQueryValues} FROM users ORDER BY id DESC;`
            };
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            log.debug(`UM: Get users list: ${JSON.stringify(data)}`);
            if (undefined != data) {
                data.forEach(user => {
                    users.push(utils.camelizeKeys(user));
                });    
            }
            result = users;
        } catch(error) {
            log.error(`UM: Error: ${error}`);
            result = {
                statusCode: 404,
                error: 'UM: Unable to read users.',
            };
        }
        return result;
    }

    async function getUser(user) {
        let result = {};
        let userData = {};

        try {
            if (undefined != user.id) {
                let returningColumns = ['id', 'firstName', 'lastName', 'username', 'role', 'state', 'enable'];

                const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

                let primaryColumn = 'id';
                let primaryColumnValue;
                let characterColumns = [];

                if (characterColumns.includes(primaryColumn)) {
                    primaryColumnValue = `'${user[primaryColumn]}'`;
                } else {
                    primaryColumnValue = user[primaryColumn];
                }
                        
                const query = {
                    text: `SELECT ${returningQueryValues} FROM users WHERE ${primaryColumn} = ${primaryColumnValue}`,
                };
                // log.debug(`UM: Get user query: ${JSON.stringify(query)}`);
                const resultQuery = await database.execute(query);
                const data = resultQuery.rows;
                // log.debug(`UM: Get user data: ${JSON.stringify(data)}`);
                if (undefined != data) {
                    userData = data[0];
                }
                // log.debug(`UM: Get user: ${JSON.stringify(userData)}`);
                result = userData;
            } else {
                // log.error(`UM: Undefined user.`);
                // result = {
                //     statusCode: 400,
                //     error: 'UM: Undefined user.',
                // };
                utils.throwError('Undefined user.');
            }
            
        } catch(error) {
            log.error(`UM: Error: ${error}`);
            result = {
                statusCode: 400,
                error: 'UM: Unable to read user.',
            };
        }
        return result;
    }

    async function upsertUser(user) {
        let result = {};
        // log.debug(`UM: Upsert user : ${JSON.stringify(user)}`);
        try {
            let insertProps = [];
            let insertValues = [];
            let updateProps = [];
            let verifyProp = ['password'];
            let verifyColumn = 'hash';
            let verifyValue;
            let acceptedColumns = ['firstName', 'lastName', 'username', 'role', 'state', 'enable'];
            let characterColumns = ['firstName', 'lastName', 'username', 'role'];
            let conflictColumns = ['username'];
            let updateColumns = ['firstName', 'lastName', 'role', 'state', 'enable', 'hash'];
            let returningColumns = ['id', 'firstName', 'lastName', 'username', 'role', 'state', 'enable'];

            for (const prop in user) {
                if ((acceptedColumns.includes(prop))) {
                    insertProps.push(`${_.snakeCase(prop)}`);
                    
                    if (characterColumns.includes(prop)) {
                        insertValues.push(`'${user[prop]}'`);
                    } else {
                        insertValues.push(user[prop]);
                    }
                    
                    if (updateColumns.includes(prop)) {
                        updateProps.push(`${_.snakeCase(prop)} = EXCLUDED.${_.snakeCase(prop)}`);
                    }
                } else {
                    if (verifyProp.includes(prop)) {
                        insertProps.push(`${verifyColumn}`);
                        verifyValue = await utils.hash(user[prop]);
                        insertValues.push(`'${verifyValue}'`);
                        if (updateColumns.includes(verifyColumn)) {
                            updateProps.push(`${_.snakeCase(verifyColumn)} = EXCLUDED.${_.snakeCase(verifyColumn)}`);
                        }
                    }
                    
                    
                }
            }

            const insertQueryColumns = insertProps.join();
            const insertQueryValues = insertValues.join();
            const conflictColumnsValues = conflictColumns.map(x => _.snakeCase(x)).join();
            const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

            const query = {
                text: `INSERT INTO users (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO UPDATE SET ${updateProps} RETURNING ${returningQueryValues}`,
            };
            // log.debug(`UM: Upsert user query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            result = utils.camelizeKeys(data[0]);
        } catch (err) {
            log.error(err);
            result = {
                statusCode: 400,
                error: 'UM: Unable to upsert user.',
            };
        }
        return result;
    }

    async function updateUser(user) {
        let result = {};
        // log.debug(`UM: Update user : ${JSON.stringify(user)}`);
        try {
            let updateStatement = [];
            let filterStatement = [];
            let acceptedColumns = ['firstName', 'lastName', 'role', 'state', 'enable'];
            let characterColumns = ['firstName', 'lastName', 'role', 'username'];
            let primaryColumns = ['username'];
            // let primaryColumnsValues = [];
            let returningColumns = ['id', 'firstName', 'lastName', 'username', 'role', 'state', 'enable'];

            for (const prop in user) {
                if (acceptedColumns.includes(prop)) {
                    if (characterColumns.includes(prop)) {
                        updateStatement.push(`${_.snakeCase(prop)} = '${user[prop]}'`);
                    } else {
                        updateStatement.push(`${_.snakeCase(prop)} = ${user[prop]}`);
                    }
                }
                if (primaryColumns.includes(prop)) {
                    if (characterColumns.includes(prop)) {
                        filterStatement.push(`${_.snakeCase(prop)} = '${user[prop]}'`);
                    } else {
                        filterStatement.push(`${_.snakeCase(prop)} = ${user[prop]}`);
                    }
                }
            }

            const updateQueryValues = updateStatement.join();
            const filterQueryValues = filterStatement.join();
            const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

            const query = {
                text: `UPDATE users SET ${updateQueryValues} WHERE ${filterQueryValues} RETURNING ${returningQueryValues}`,
            };
            // log.debug(`UM: Upsert user query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            if (undefined != data) {
                result = utils.camelizeKeys(data[0]);
            }
        } catch (err) {
            log.error(err);
            result = {
                statusCode: 400,
                error: 'UM: Unable to update user.',
            };
        }
        return result;
    }

    async function updateUserPassword(user) {
        let result = {};
        // log.debug(`UM: Update user : ${JSON.stringify(user)}`);
        try {
            let passwordProp = 'password';
            let password = utils.extractPassword(user, passwordProp);
            let userData = await getUserByUsername(user);
            if (undefined != userData && undefined != password) {
                let passwordMatch = utils.verifyPassword(userData, password);
                if (passwordMatch) {
                    log.info(`UM: password match.`);
                    let updateStatement = [];
                    let filterStatement = [];
                    let verifyProp = ['newPassword'];
                    let verifyColumn = 'hash';
                    let verifyValue;
                    let acceptedColumns = ['state'];
                    let characterColumns = ['username'];
                    let primaryColumns = ['username'];
                    let returningColumns = ['id', 'firstName', 'lastName', 'username', 'role', 'state', 'enable'];

                    for (const prop in user) {
                        if (acceptedColumns.includes(prop)) {
                            if (characterColumns.includes(prop)) {
                                updateStatement.push(`${_.snakeCase(prop)} = '${user[prop]}'`);
                            } else {
                                updateStatement.push(`${_.snakeCase(prop)} = ${user[prop]}`);
                            }
                        } else {
                            if (verifyProp.includes(prop)) {
                                // get hash
                                verifyValue = await utils.hash(user[prop]);
                                // verifyValue = await bcrypt.hash(user[prop], 10);
                                updateStatement.push(`${_.snakeCase(verifyColumn)} = '${verifyValue}'`);
                            }
                        }
                        if (primaryColumns.includes(prop)) {
                            if (characterColumns.includes(prop)) {
                                filterStatement.push(`${_.snakeCase(prop)} = '${user[prop]}'`);
                            } else {
                                filterStatement.push(`${_.snakeCase(prop)} = ${user[prop]}`);
                            }
                        }
                    }

                    const updateQueryValues = updateStatement.join();
                    const filterQueryValues = filterStatement.join();
                    // const conflictColumnsValues = primaryColumns.map(x => _.snakeCase(x)).join();
                    const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

                    const query = {
                        text: `UPDATE users SET ${updateQueryValues} WHERE ${filterQueryValues} RETURNING ${returningQueryValues}`,
                    };
                    // log.debug(`UM: Upsert user query: ${JSON.stringify(query)}`);
                    const resultQuery = await database.execute(query);
                    const data = resultQuery.rows;
                    if (undefined != data) {
                        result = utils.camelizeKeys(data[0]);
                    }
                    // log.debug(`UM: Update user result: ${JSON.stringify(result)}`);
                } else {
                    log.info(`UM: Username or password is incorrect.`);
                    result = {
                        statusCode: 200,
                        error: 'Username or password is incorrect.',
                    };
                }
            }
        } catch (err) {
            log.error(err);
            result = {
                statusCode: 400,
                error: 'UM: Unable to update user.',
            };
        }
        return result;
    }

    async function insertUser(user) {
        let result = {};
        log.info(`UM: Insert user : ${JSON.stringify(user)}`);
        try {
            let insertProps = [];
            let insertValues = [];
            let verifyProp = ['password'];
            let verifyColumn = 'hash';
            let verifyValue;
            let acceptedColumns = ['firstName', 'lastName', 'username', 'role', 'state', 'enable'];
            let characterColumns = ['firstName', 'lastName', 'username', 'role'];
            let conflictColumns = ['username'];
            // let updateColumns = ['firstName', 'lastName', 'role'];
            let returningColumns = ['id', 'firstName', 'lastName', 'username', 'role', 'state', 'enable'];

            for (const prop in user) {
                if ((acceptedColumns.includes(prop))) {
                    insertProps.push(`${_.snakeCase(prop)}`);
                    
                    if (characterColumns.includes(prop)) {
                        insertValues.push(`'${user[prop]}'`);
                    } else {
                        insertValues.push(user[prop]);
                    }
                } else {
                    if (verifyProp.includes(prop)) {
                        insertProps.push(`${verifyColumn}`);
                        verifyValue = await utils.hash(user[prop]);
                        insertValues.push(`'${verifyValue}'`);
                    }
                }
            }

            const insertQueryColumns = insertProps.join();
            const insertQueryValues = insertValues.join();
            const conflictColumnsValues = conflictColumns.map(x => _.snakeCase(x)).join();
            const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

            const query = {
                text: `INSERT INTO users (${insertQueryColumns}) VALUES(${insertQueryValues}) ON CONFLICT (${conflictColumnsValues }) DO NOTHING RETURNING ${returningQueryValues}`,
            };
            log.info(`UM: Insert user query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            result = utils.camelizeKeys(data[0]);
        } catch (err) {
            log.error(err);
            result = {
                statusCode: 400,
                error: 'UM: Username already taken.',
            };
        }
        return result;
    }
    
    async function deleteUser(user) {
        let result = {};
        log.debug(`UM: Delete user: ${JSON.stringify(user)}`);
        try {
            let primaryColumn = 'id';
            let primaryColumnValue;
            let characterColumns = [];
            let returningColumns = ['id', 'firstName', 'lastName', 'username', 'role'];

            if (characterColumns.includes(primaryColumn)) {
                primaryColumnValue = `'${user[primaryColumn]}'`;
            } else {
                primaryColumnValue = user[primaryColumn];
            }

            const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();
                    
            const query = {
                text: `DELETE FROM users WHERE ${primaryColumn} = ${primaryColumnValue} RETURNING ${returningQueryValues}`,
            };
            log.debug(`UM: Delete user query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            result = utils.camelizeKeys(data[0]);
        } catch (err) {
            log.error(err);
            result = {
                statusCode: 400,
                error: 'UM: Unable to delete user.',
            };
        }
        return result;
    }

    async function deleteUsers(users) {
        let result = {};
        log.debug(`SM: Delete users: ${JSON.stringify(users)}`);
        try {
            let primaryColumn = 'id';
            let primaryColumnValues = users[primaryColumn];

            let returningColumns = ['id'];

            const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

            const query = {
                text: `DELETE FROM users WHERE ${primaryColumn} IN (${primaryColumnValues}) RETURNING ${returningQueryValues}`,
            };
            
            log.debug(`SM: Delete user query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            result = utils.camelizeKeys(data);
            // log.debug(`SM: Delete user returning: ${JSON.stringify(data)}`);
            // result = data;
        } catch (err) {
            log.error(err);
            result = {
                statusCode: 400,
                error: 'SM: Unable to delete users.',
            };
        }
        return result;
    }

    

    
    
    // function generateJwtToken(account) {
    //     // create a jwt token containing the account id that expires in 15 minutes
    //     return jwt.sign({ sub: account.id, id: account.id }, config.secret, { expiresIn: '15m' });
    // }
    

    

    async function getUserByUsername(user) {
        let userData = {};
        let primaryColumn = 'username';
        let primaryColumnValue;
        let characterColumns = ['username'];

        let returningColumns = ['id', 'firstName', 'lastName', 'username', 'role', 'enable', 'state', 'hash'];

        if (characterColumns.includes(primaryColumn)) {
            primaryColumnValue = `'${user[primaryColumn]}'`;
        } else {
            primaryColumnValue = user[primaryColumn];
        }

        const returningQueryValues = returningColumns.map(x => _.snakeCase(x)).join();

        const query = {
            text: `SELECT ${returningQueryValues} FROM users WHERE ${primaryColumn} = ${primaryColumnValue}`,
        };
        // log.debug(`UM: Get user query: ${JSON.stringify(query)}`);
        const resultQuery = await database.execute(query);
        const data = resultQuery.rows;

        if (undefined != data) {
            userData = utils.camelizeKeys(data[0]);
        }
        return userData;
    }

    

    

    // function generateJwtToken(userData) {
    //     let secret = config.secret;
    //     const token = jwt.sign({ sub: userData.id }, secret, { expiresIn: '1d' });
    //     delete userData['hash'];
    //     userData['token'] = token;
    // }

    // function generateRefreshToken(account, ipAddress) {
    
})();