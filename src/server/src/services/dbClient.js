(function () {
    // const db = require('../db/databaseOracle.js');
    const db = require('../persistence/databasePostgres.js');

    module.exports.initialize = db.initialize;
    module.exports.close = db.close;
    module.exports.simpleExecute = db.simpleExecute;
    module.exports.execute = db.execute;
    module.exports.executeStream = db.executeStream;
    module.exports.isConnected = db.isConnected;
}());