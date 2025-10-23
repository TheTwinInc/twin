(function () {
    const path = require('path');
    const rootPath = path.normalize(__dirname + '/../../');
    
    module.exports = {
        development: {
            db : 'postgres',
            dbEnabled : true,
            rootPath: rootPath,
            ip: process.env.IP || '127.0.0.1',
            port : 8080,
            bsm: {
                server : {
                    ip: '0.0.0.0',
                    port: 9653,
                    offset: 0,
                    watchDog: 30000
                },
            },
            retryCommand: 5,
            secret: '!Solrac2212',
            dateFormat: "yyyy-MM-dd'T'HH:mm:ss.SSS",
            keepaliveIntervalDelay: 30000,
            monitorIntervalDelay: 30000,
            mynetFile: 'c:/twin/log/mynet.log',
            reportsPath: 'c:/twin/reports'
        },
        production: {
            db : 'postgres',
            dbEnabled : true,
            rootPath: rootPath,
            ip: process.env.IP || '127.0.0.1',
            port : 8080,
            bsm: {
                server : {
                    ip: '0.0.0.0',
                    port: 9653,
                    offset: 0,
                    watchDog: 30000
                }
            },
            retryCommand: 5,
            secret: '!Solrac2212',
            dateFormat: "yyyy-MM-dd'T'HH:mm:ss.SSS",
            keepaliveIntervalDelay: 30000,
            monitorIntervalDelay: 30000,
            mynetFile: 'c:/twin/log/mynet.log',
            reportsPath: 'c:/twin/reports'
        }
   };
}());
