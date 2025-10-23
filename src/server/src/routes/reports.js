(function () {
    const reports = require('../controllers/reportsController');
    const express = require('express');
    let router = express.Router();
    const authorize = require('../middleware/authorize.js');

    // router.get('/', reports.getBagsPerAirline);
    router.get('/:type.:frequency.:date', reports.getReport);
    // router.get('/:type.:frequency.:date', authorize(), reports.getReport);

    module.exports = router;
}());

