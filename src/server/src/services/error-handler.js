(function () {
    
    const errorHandler = require('../middleware/error-handler');

    module.exports = function (app, config) {

        app.use(errorHandler);
    };
}());
