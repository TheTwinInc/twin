(function () {
    const log = require('../utils/log');
    const flights = require('../models/flightsModel');
    const { formatISO } = require("date-fns");
  
    // module.exports.getBag = getBag;
    module.exports.getFlights = getFlights;
    module.exports.getDepartureFlights = getDepartureFlights;
    module.exports.getDepartureDisplay = getDepartureDisplay;
    module.exports.insertDepartureFlight = insertDepartureFlight;
    module.exports.updateDepartureFlightLocation = updateDepartureFlightLocation;
    module.exports.updateDepartureFlightSecurity = updateDepartureFlightSecurity;
    module.exports.upsertDepartureFlights = upsertDepartureFlights;
    module.exports.deleteFlight = deleteFlight;
    module.exports.deleteFlights = deleteFlights;
    
    async function getFlights(req, res) {
        let result = {};
        try {
            log.debug(`FC: Getting flights`);
            result = await flights.getFlights();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getDepartureFlights(req, res) {
        let result = {};
        try {
            log.debug(`FC: Getting departure flights`);
            result = await flights.getDepartureFlights();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }
  
    async function getDepartureDisplay(req, res) {
        let result = {};
        try {
            log.debug(`FC: Getting departure display`);
            const context = {
                'display': req.params.display == undefined ? '' : req.params.display,
            }
            result = await flights.getDepartureDisplay(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function insertDepartureFlight(req, res) {
        try {
            log.info(`Insert Flight Body: ${JSON.stringify(req.body)}`);
            const context = {
                'flightKey': req.body.flightKey == undefined ? '' : req.body.flightKey.replace(/"|'/g, ''),
                'flightNumber': req.body.flightNumber == undefined ? '' : req.body.flightNumber.replace(/"|'/g, ''),
                'scheduleTime': req.body.scheduleTime == undefined ? '' : formatISO(new Date(req.body.scheduleTime.replace(/"|'/g, ''))),
                'arrDep':  'D',
                'domInt':  '',
                'airport': req.body.destination == undefined ? '' : req.body.destination.replace(/"|'/g, ''),
                'airline': req.body.airline == undefined ? '' : req.body.airline.replace(/"|'/g, ''),
                'location': req.body.location == undefined ? '' : req.body.location.replace(/"|'|\[|\]/g, ''),
                'open': req.body.open == undefined ? '' : req.body.open.replace(/"|'/g, ''),
                'close': req.body.close == undefined ? '' : req.body.close.replace(/"|'/g, ''),
            }
            let result;
            await flights.insertDepartureFlight(context);
            await flights.updateDepartureFlightLocation(context);
            res.status(200).end(JSON.stringify(context));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }
  
    async function updateDepartureFlightLocation(req, res) {
        try {
            log.info(`Upsert Flight Body: ${JSON.stringify(req.body)}`);
            const context = {
                'flightKey': req.body.flightKey == undefined ? '' : req.body.flightKey.replace(/"|'/g, ''),
                'location': req.body.location == undefined ? '' : req.body.location.replace(/"|'|\[|\]/g, ''),
                'open': req.body.open == undefined ? '' : req.body.open.replace(/"|'/g, ''),
                'close': req.body.close == undefined ? '' : req.body.close.replace(/"|'/g, ''),
            }
            let result;
            result = await flights.updateDepartureFlightLocation(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function updateDepartureFlightSecurity(req, res) {
        try {
            log.info(`Update Security Flight: ${JSON.stringify(req.body)}`);
            const context = {
                'flightKey': req.body.flightKey == undefined ? '' : req.body.flightKey.replace(/"|'/g, ''),
                'securityOverride': req.body.securityOverride == undefined ? null : req.body.securityOverride.replace(/"|'|\[|\]/g, ''),
            }
            let result;
            result = await flights.updateDepartureFlightSecurity(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function upsertDepartureFlights(req, res) {
        try {
            log.info(`Upsert Flights Body: ${JSON.stringify(req.body)}`);
            const context = {
                'flights': req.body.flights == undefined ? '' : req.body.flights
            }
            let result;
            result = await flights.upsertFlights(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function deleteFlight(req, res) {
        try {
            const context = {
                'flightKey': req.params.flightKey == undefined ? '' : req.params.flightKey,
            }
            let result;
            if ('' != context.flightKey){
                result = await flights.deleteFlight(context);
                res.status(200).end(JSON.stringify(result));
            } else {
                res.status(404).end();
            }
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function deleteFlights(req, res) {
        try {
            const context = {
                'flightKey': req.body.flightKeys == undefined ? '' : req.body.flightKeys,
            }
            let result;
            if ('' != context.code){
                result = await flights.deleteFlights(context);
                res.status(200).end(JSON.stringify(result));
            } else {
                res.status(404).end();
            }
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }
})();