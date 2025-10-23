(function () {
    const users = require('../controllers/usersController.js');
    const account = require('../controllers/accountController.js');
    const express = require('express');
    let router = express.Router();
    const authorize = require('../middleware/authorize.js');
    const Role = require('../config/roles.js');
    const { authenticateSchema,
        registerSchema,
        forgotPasswordSchema,
        changePasswordSchema,
        deleteUserSchema,
        userSchema
    } = require('../middleware/schemas.js');

    // router.get('/', users.getUsers);
    router.get('/', authorize([Role.Admin, Role.root]), users.getUsers);
    router.post('/authenticate', authenticateSchema, account.authenticateUser);
    router.post('/refresh-token', account.refreshToken);
    router.post('/revoke-token', account.revokeToken);
    router.put('/register', [authorize(), registerSchema], users.insertUser);
    // Needs to be hardened
    
    router.put('/forgot-password/:id', forgotPasswordSchema, users.forgotPassword);
    router.put('/change-password/:id', authorize(), changePasswordSchema, users.changePassword);
    
    router.put('/batch-delete', deleteUserSchema, authorize(), users.deleteUsers);
    // router.put('/password/:id', authorize(), users.upsertUser);
    router.get('/:id', authorize(), users.getUser);
    router.put('/:id', [authorize(), userSchema], users.upsertUser);
    router.delete('/:id', authorize(), users.deleteUser);
    
    module.exports = router;
}());

