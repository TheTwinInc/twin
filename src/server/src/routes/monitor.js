(function () {
    const monitor = require('../controllers/monitorController.js');
    const express = require('express');
    let router = express.Router();
    const authorize = require('../middleware/authorize.js');

    router.get('/heartbeat', monitor.getHeartbeats);
    router.put('/heartbeat/:id', monitor.upsertHeartbeat);
    router.get('/twin-statistics', authorize(), monitor.getTwinStatistics);
    router.get('/location-statistics/:bucket', authorize(), monitor.getLocationStatistics);
    router.get('/system-information', authorize(), monitor.getSystemInformation);
    router.get('/file-tail', monitor.getFileTail);

    module.exports = router;
}());

