(function () {
    const twin = require('../controllers/twinController.js');
    const express = require('express');
    let router = express.Router();
    const authorize = require('../middleware/authorize.js');

    router.get('/handlers', authorize(), twin.getHandlers);
    router.put('/handlers/:id', authorize(), twin.upsertHandler);
    router.get('/locations', twin.getLocations);
    // router.get('/locations', authorize(), twin.getLocations);
    router.put('/locations/:id', authorize(), twin.upsertLocation);
    router.put('/locations/batch/delete', authorize(), twin.deleteLocations);
    router.delete('/locations/:id', authorize(), twin.deleteLocation);
    router.get('/airports', authorize(), twin.getAirports);
    router.put('/airports/:code', authorize(), twin.upsertAirport);
    router.put('/airports/batch/delete', authorize(), twin.deleteAirports);
    router.delete('/airports/:code', authorize(), twin.deleteAirport);
    router.get('/airlines', authorize(), twin.getAirlines);
    router.put('/airlines/:code', authorize(), twin.upsertAirline);
    router.put('/airlines/batch/delete', authorize(), twin.deleteAirlines);
    router.delete('/airlines/:code', authorize(), twin.deleteAirline);
    router.get('/settings', twin.getSettings);
    router.put('/settings/:name', authorize(), twin.upsertSetting);
    
    module.exports = router;
}());

