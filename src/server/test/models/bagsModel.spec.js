const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;
const assert = chai.assert;

const log = require('../../src/utils/log');
const bags = require('../../src/models/bagsModel');
const dbClient = require('../../src/services/dbClient');
const database = require('../../src/persistence/databasePostgres');

describe.skip('Bags Model', () => {
    
    
    before(async () => {
        try {
            await dbClient.initialize();
            const query = {
                text: `DELETE FROM bags;`
            };
            await database.execute(query);
        } catch (e) {
            log.error(e);
        }
	})

	after(async () => {
        try {
            await dbClient.close();
        } catch (e) {
            log.error(e);
        }
    })

    it('it should get a bag', async () => {
        let bag = {
            identificationCode: '0657276317',
            flightNumber: 'BT154'
        };
        let bagInfo = await bags.getBag(bag);
        assert.exists(bagInfo);
        assert.equal(bag.identificationCode, bagInfo.identificationCode);
    });

    it('it should insert a bag', async () => {
        let bag = {
            identificationCode: '0657276318',
            flightNumber: 'BT154'
        };
        let bagInfo = await bags.upsertBag(bag);
        assert.exists(bagInfo);
        // log.info(bagInfo);
        assert.equal(bag.identificationCode, bagInfo.identificationCode);
        assert.equal(bag.flightNumber, bagInfo.flightNumber);
    });

    it('it should update a bag', async () => {
        let bag = {
            identificationCode: '0657276318',
            flightNumber: 'BT155'
        };
        let bagInfo = await bags.upsertBag(bag);
        assert.exists(bagInfo);
        assert.equal(bag.identificationCode, bagInfo.identificationCode);
        assert.equal(bag.flightNumber, bagInfo.flightNumber);
    });
});