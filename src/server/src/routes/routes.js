(function () {
    const log = require('../utils/log');
    const tasks = require('./tasks');
    const bags = require('./bags');
    const bagMessage = require('./bagMessage');
    const flights = require('./flights');
    const twin = require('./twin');
    const monitor = require('./monitor');
    const reports = require('./reports');
    const users = require('./users');
    

    module.exports = function(app, config) {

        app.use('/api/tasks', tasks);
        app.use('/api/bags', bags);
        app.use('/api/bsm', bagMessage);
        app.use('/api/flights', flights);
        app.use('/api/twin', twin);
        app.use('/api/monitor', monitor);
        app.use('/api/reports', reports);
        app.use('/api/users', users);
        app.all('/api/endpoints', allEndpoints);
        app.all('/api/*', allApi);
        app.all('*', allStar);

        function allEndpoints (req, res) {
            let routes = app._router.stack          // registered routes
                .filter(r => r.route)               // take out all the middleware
                .map(r => r.route.path);            // get all the paths
            log.info(routes);
            res.status(200).end(JSON.stringify(routes));
        }

        function allApi (req, res) {
            res.sendStatus(200);
        }

        function allStar (req, res) {
            res.sendStatus(200);
        }
    };

}());
