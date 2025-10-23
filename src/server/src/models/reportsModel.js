(function () {
    const { stringify } = require('csv-stringify/sync');
    const database = require('../persistence/databasePostgres.js');
    const log = require('../utils/log');
    const utils = require('../utils/utils');
    const { format, parseISO } = require("date-fns");

    const AdmZip = require('adm-zip');

    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config')[env];

    const reports = {
        'sortation_day': 'v_report_sortation_daily',
        'sortation_month': 'v_report_sortation_daily',
        'flight_day': 'v_stats_flight_daily',
        'flight_month': 'v_stats_flight_monthly'
    }

    module.exports.getBagsPerAirline = getBagsPerAirline;
    module.exports.getReport = getReport;
    module.exports.getFileReport = getFileReport;

    async function getBagsPerAirline(filter) {
        let result = {};
        let rows = [];

        try {
            const query = {
                text: `SELECT * FROM v_bags_info`
            };
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            const dataTest = stringify([ [1], [2] ], {
                cast: {
                  number: function(value){
                    return {value: `="${value}"`, quote: false};
                  }
                }
              });
            if (undefined != data) {
                for (let index = 0; index < data.length; index++) {
                    const row = data[index];
                    rows.push(utils.camelizeKeys(row));
                }
            }
            const output = stringify(rows, {
                header: true,
                cast: {
                    date: function(value) {
                        return value.toISOString();
                    }
                }
            });
            // log.debug(`RM: Output: ${JSON.stringify(output)})`);
            result = output;
        } catch(error) {
            log.error(`RM: Error: ${error}`);
            result = {
                error: 'RM: Unable to generate report.',
            };
        }
        return result;
    }

    async function getReport(report) {
        let result = {};
        let rows = [];
        const reportName = `${report.type}_${report.frequency}`;
        // log.debug(`RM: Report context: ${JSON.stringify(report)}`);
        try {
            let query;
            if (reportName == 'sortation_day') {
                query = {
                    text: `SELECT * FROM ${reports[reportName]} WHERE departure_date = $1;`,
                    values: [report.date]
                };
            } else if (reportName == 'sortation_month') {
                query = {
                    text: `SELECT * FROM ${reports[reportName]} WHERE to_char(departure_date, 'YYYY-MM') = $1;`,
                    values: [report.date.slice(0,7)]
                };
            }
            
            // log.debug(`RM: Report query: ${JSON.stringify(query)}`);
            const resultQuery = await database.execute(query);
            const data = resultQuery.rows;
            const output = stringify(data, {
                header: true,
                cast: {
                    date: function(value) {
                        return format(value, 'yyyy-MM-dd');
                    }
                }
            });
            result = output;
        } catch(error) {
            log.error(`RM: Error: ${error}`);
            result = {
                error: 'RM: Unable to generate report.',
            };
        }
        return result;
    }

    async function getFileReport(report) {
        let result = {};
        let rows = [];
        const reportName = `${report.type}_${report.frequency}`;
        // log.debug(`RM: Report context: ${JSON.stringify(report)}`);
        let departureDate = parseISO(report.date);
        
        try {
            if (reportName == 'flight_day') {
                let dateFile = format(departureDate, 'yyyyMMdd');
                const fileNameZip = `${dateFile}_${reports[reportName]}.zip`;
                const fileNameCsv = `${dateFile}_${reports[reportName]}.csv`;
                // log.debug(`RM: File name zip: ${JSON.stringify(fileNameZip)}`);
                const datePath = format(departureDate, 'yyyy/MM');
                const filePath = `${config.reportsPath}/${datePath}/${fileNameZip}`;

                let zip = new AdmZip(filePath);
                const data = zip.readAsText(fileNameCsv);
                result = data;
            }
        } catch(error) {
            log.error(`RM: Error: ${error}`);
            result = {
                error: 'RM: Unable to generate report.',
            };
        }
        return result;
    }
})();
