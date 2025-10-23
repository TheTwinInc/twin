(function () {
    const log = require('../utils/log');
    const tasks = require('../models/tasksModel');
  
    module.exports.getTasks = getTasks;
    module.exports.executeTask = executeTask;

    async function getTasks(req, res) {
        let result = {};
        try {
            result = await tasks.getTasks();
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }

    async function executeTask(req, res) {
        let result = {};
        try {
            const context = {
                'name': req.body.name == undefined ? '' : req.body.name,
                'command': req.body.name == undefined ? '' : req.body.command,
                'id' : req.body.id == undefined ? '' : req.body.id
            }
            if (context.name) {
                result = await tasks.executeTask(context);
                
            }
            res.status(200).end(JSON.stringify(result));
        } catch (err) {
            log.error(err);
            res.status(404).end();
        }
    }
})();