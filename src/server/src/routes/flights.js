(function () {
    const flights = require('../controllers/flightsController');
    const express = require('express');
    let router = express.Router();
    const authorize = require('../middleware/authorize.js');

    router.get('/', authorize(), flights.getFlights);
    router.get('/departure', authorize(), flights.getDepartureFlights);
    router.put('/departure/:flightNumber', authorize(), flights.insertDepartureFlight);
    router.put('/departure/location/:flightKey', authorize(), flights.updateDepartureFlightLocation);
    router.put('/departure/security/:flightKey', authorize(), flights.updateDepartureFlightSecurity);
    // router.post('/departure/security/:flightKey', authorize(), flights.updateDepartureFlightSecurity);
    router.get('/departure/display/:display', flights.getDepartureDisplay);
    // router.put('/', authorize(), flights.upsertDepartureFlights);
    // router.put('/:flightKey', authorize(), flights.upsertDepartureFlight);
    router.put('/departure/batch/delete', authorize(), flights.deleteFlights);
    router.delete('/departure/:flightKey', authorize(), flights.deleteFlight);
    
    // router.get('/:id/flight', flights.getflight);

    module.exports = router;
}());
