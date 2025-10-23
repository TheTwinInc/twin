(function () {
    const tasks = require('../controllers/tasksController.js');
    const express = require('express');
    let router = express.Router();
    const authorize = require('../middleware/authorize.js')

    router.get('/', authorize(), tasks.getTasks);
    router.put('/task/', authorize(), tasks.executeTask);

    module.exports = router;
}());

