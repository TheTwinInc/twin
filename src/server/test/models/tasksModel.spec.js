const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;
const assert = chai.assert;

const log = require('../../src/utils/log');
const tasks = require('../../src/models/tasksModel');

let platform = process.platform;

const processes = require('../../src/config/processes')[platform];
// const commands = require('../../src/utils/commands')[platform];

describe('Service Tasks', () => {
    before(async () => {
        
	})

    it.skip('it should return the services', async () => {
        // let services = await tasks.services(processes);
        let services = {};
        tasks.getTasks(processes).then((data, error) => {
            if (!error) {
                log.info(`TEST:Services: ${JSON.stringify(data)}`);
                services = data;
                assert.isArray(services);
            }
            
        });
    });

    it('it should get the status of a service', async () => {
        // let services = await tasks.services(processes);
        const context = {
            'name': 'Grafana',
            'command': 'status'
        }
        tasks.executeTask(context).then((data, error) => {
            if (!error) {
                log.info(`Service: ${JSON.stringify(data)}`);
                assert.isNotEmpty(data);
            }
            
        });
    });
});