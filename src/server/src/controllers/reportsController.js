(function () {
    const log = require('../utils/log');
    const reports = require('../models/reportsModel');
  
    module.exports.getBagsPerAirline = getBagsPerAirline;
    module.exports.getReport = getReport;

    async function getBagsPerAirline(req, res) {
        let result = {};
        try {
            result = await reports.getBagsPerAirline();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function getReport(req, res) {
        let result = {};
        try {
            const context = {
                'type': req.params.type == undefined ? '' : req.params.type,
                'frequency': req.params.frequency == undefined ? '' : req.params.frequency,
                'date': req.params.date == undefined ? '' : req.params.date,
            }
            if (context.type == 'sortation') {
                result = await reports.getReport(context);
            } else if (context.type == 'flight') {
                result = await reports.getFileReport(context); 
            }
            
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }
})();