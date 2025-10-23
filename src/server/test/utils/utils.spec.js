const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;
const assert = chai.assert;

const log = require('../../src/utils/log');
const utils = require('../../src/utils/utils');

let platform = process.platform;

const processes = require('../../src/config/processes')[platform];

describe('Utils', () => {
    before(async () => {
        
	})

    it.skip('it should get a service', async () => {
        let serviceName = 'TWIN.BagService';
        let winCommand = `Get-CimInstance Win32_Service -Filter "Name LIKE '${serviceName}'" | select Name,Caption,Started,StartMode,ProcessId | fl`;
        let result = await utils.powerShell(winCommand);
        log.info(`Result: ${result}`);
    });

    it.skip('it should start a service', async () => {
        let result = {};
        let serviceName = 'Grafana';
        let winCommand = `Stop-Service -Name "${serviceName}"`;
        // let winCommand = `Get-Service -Name "${serviceName}"`;
        let serviceStatus = utils.powerShell(winCommand);
        serviceStatus.then((data, error) => {
            if (!error) {
                log.info(`Data: ${data}`);
                result = data;
            } else {
                log.info(`Service error: ${error}`);
            }
        })
        log.info(`Result: ${result}`);
    });
});