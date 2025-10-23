(function () {
    const log = require('../utils/log');
    const monitor = require('../models/monitorModel');
  
    module.exports.getTwinStatistics = getTwinStatistics;
    module.exports.getLocationStatistics = getLocationStatistics;
    module.exports.getSystemInformation = getSystemInformation;
    module.exports.getHeartbeats = getHeartbeats;
    module.exports.upsertHeartbeat = upsertHeartbeat;
    module.exports.getFileTail = getFileTail;

    async function getTwinStatistics(req, res) {
        let result = {};
        try {
            result = await monitor.getTwinStatistics();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getSystemInformation(req, res) {
        let result = {};
        try {
            result = await monitor.getSystemInformation();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getLocationStatistics(req, res) {
        let result = {};
        try {
            const context = {
                'bucket': req.params.bucket == undefined ? '' : req.params.bucket,
            }
            result = await monitor.getLocationStatistics(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getHeartbeats(req, res) {
        let result = {};
        try {
            result = await monitor.getHeartbeats();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function upsertHeartbeat(req, res) {
        try {
            const context = {
                'id': req.body.id == undefined ? '' : req.body.id,
                'name': req.body.name == undefined ? '' : req.body.name,
                'status': req.body.status == undefined ? '' : req.body.status,
            }
            let result;
            result = await monitor.upsertHeartbeat(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getFileTail(req, res) {
        let result = {};
        try {
            const context = {
                'name': req.body.name == undefined ? '' : req.body.name,
            }
            result = await monitor.getFileTail(context);
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }
})();