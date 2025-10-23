(function () {
    const log = require('../utils/log');
    const twin = require('../models/twinModel');
  
    module.exports.getHandlers = getHandlers;
    module.exports.upsertHandler = upsertHandler;
    module.exports.getLocations = getLocations;
    module.exports.upsertLocation = upsertLocation;
    module.exports.deleteLocation = deleteLocation;
    module.exports.deleteLocations = deleteLocations;
    module.exports.getAirports = getAirports;
    module.exports.upsertAirport = upsertAirport;
    module.exports.deleteAirport = deleteAirport;
    module.exports.deleteAirports = deleteAirports;
    module.exports.getAirlines = getAirlines;
    module.exports.upsertAirline = upsertAirline;
    module.exports.deleteAirline = deleteAirline;
    module.exports.deleteAirlines = deleteAirlines;
    module.exports.getSettings = getSettings;
    module.exports.upsertSetting = upsertSetting;
    

    async function getHandlers(req, res) {
        let result = {};
        try {
            result = await twin.getHandlers();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function upsertHandler(req, res) {
        try {
            const context = {
                'id': req.body.id == undefined ? '' : req.body.id,
                'name': req.body.name == undefined ? '' : req.body.name,
                'location': req.body.location == undefined ? '' : req.body.location,
            }
            let result;
            result = await twin.upsertHandler(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getLocations(req, res) {
        let result = {};
        try {
            result = await twin.getLocations();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function upsertLocation(req, res) {
        try {
            const context = {
                'id': req.body.id == undefined ? '' : req.body.id,
                'name': req.body.name == undefined ? '' : req.body.name,
                'type': req.body.type == undefined ? '' : req.body.type,
                'area': req.body.area == undefined ? '' : req.body.area,
                'enable': req.body.enable == undefined ? '' : req.body.enable,
                'description': req.body.description == undefined ? '' : req.body.description,
            }
            let result;
            result = await twin.upsertLocation(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function deleteLocation(req, res) {
        try {
            const context = {
                'id': req.params.id == undefined ? '' : req.params.id,
            }
            let result;
            if ('' != context.id){
                result = await twin.deleteLocation(context);
                res.status(200).end(JSON.stringify(result));
            } else {
                res.status(404).end();
            }
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function deleteLocations(req, res) {
        try {
            const context = {
                'area': req.body.areas == undefined ? '' : req.body.areas,
                'type': req.body.types == undefined ? '' : req.body.types,
                'id': req.body.ids == undefined ? '' : req.body.ids,
            }
            let result;
            if ('' != context.codes){
                result = await twin.deleteLocations(context);
                res.status(200).end(JSON.stringify(result));
            } else {
                res.status(404).end();
            }
            
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getAirports(req, res) {
        let result = {};
        try {
            result = await twin.getAirports();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function upsertAirport(req, res) {
        try {
            const context = {
                'code': req.body.code == undefined ? '' : req.body.code,
                'name': req.body.name == undefined ? '' : req.body.name,
                'icao': req.body.icao == undefined ? '' : req.body.icao,
                'domain': req.body.domain == undefined ? '' : req.body.domain,
            }
            let result;
            if ('' != context.code) {
                result = await twin.upsertAirport(context);
                res.status(200).end(JSON.stringify(result));
            } else {
                res.status(404).end()
            }
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }
    
    async function deleteAirport(req, res) {
        try {
            const context = {
                'code': req.params.code == undefined ? '' : req.params.code,
            }
            let result;
            if ('' != context.code){
                result = await twin.deleteAirport(context);
                res.status(200).end(JSON.stringify(result));
            } else {
                res.status(404).end();
            }
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function deleteAirports(req, res) {
        try {
            const context = {
                'code': req.body.codes == undefined ? '' : req.body.codes,
            }
            let result;
            if ('' != context.code){
                result = await twin.deleteAirports(context);
                res.status(200).end(JSON.stringify(result));
            } else {
                res.status(404).end();
            }
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getAirlines(req, res) {
        let result = {};
        try {
            result = await twin.getAirlines();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function upsertAirline(req, res) {
        try {
            const context = {
                'code': req.body.code == undefined ? '' : req.body.code,
                'name': req.body.name == undefined ? '' : req.body.name,
                'airline': req.body.code == undefined ? '' : req.body.code,
                'location': req.body.location == undefined ? '' : req.body.location,
                'handlerId': '1',
            }
            let result;
            if ('' != context.code) {
                result = await twin.upsertAirline(context);
                result['location'] = context.location;
                await twin.upsertAirlineLocation(context);
                res.status(200).end(JSON.stringify(result));
            } else {
                res.status(404).end()
            }
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }
    
    async function deleteAirline(req, res) {
        try {
            const context = {
                'code': req.params.code == undefined ? '' : req.params.code,
            }
            let result;
            if ('' != context.code){
                result = await twin.deleteAirline(context);
                res.status(200).end(JSON.stringify(result));
            } else {
                res.status(404).end();
            }
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function deleteAirlines(req, res) {
        try {
            const context = {
                'code': req.body.codes == undefined ? '' : req.body.codes,
            }
            let result;
            if ('' != context.code){
                result = await twin.deleteAirlines(context);
                res.status(200).end(JSON.stringify(result));
            } else {
                res.status(404).end();
            }
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getSettings(req, res) {
        let result = {};
        try {
            result = await twin.getSettings();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function upsertSetting(req, res) {
        try {
            const context = {
                'name': req.body.name == undefined ? '' : req.body.name,
                'value': req.body.value == undefined ? '' : req.body.value,
                'description': req.body.description == undefined ? '' : req.body.description,
            }
            let result;
            result = await twin.upsertSetting(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }
})();