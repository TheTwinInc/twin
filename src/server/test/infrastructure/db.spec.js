const chai = require("chai");
const sinon = require("sinon");
const expect = chai.expect;
const assert = chai.assert;

const log = require('../../src/utils/log');
const bags = require('../../src/models/bagsModel');
const dbClient = require('../../src/services/dbClient');
const database = require('../../src/persistence/databasePostgres');

describe.skip('Database', () => {
    
    
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
	

    // it('it should get a bag', async () => {
    //     const query = {
    //         text: `SELECT NOW();`
    //     };
    //     const resultQuery = await database.execute(query);
    //     let data = resultQuery.rows[0];
    //     assert.exists(data);
    // });
    // it('it should insert an item', async () => {
    //     let bag = {
    //         identificationCode: '0657276317',
    //         flighNumber: 'BT154'
    //     };
    //     const query = {
    //         text: `INSERT INTO bags(identification_code, flight_number) VALUES($1, $2) ON CONFLICT DO NOTHING RETURNING *;`,
    //         values: [bag.identificationCode, bag.flighNumber]
    //     };
    //     const resultQuery = await database.execute(query);
    //     let data = resultQuery.rows[0];
    //     assert.exists(data);
    // });

    it('it should get an item using select', async () => {
        let bag = {
            identificationCode: '0657276317',
            flighNumber: 'BT154'
        };
        const query = {
            text: `SELECT * FROM bags WHERE identification_code = $1 ORDER BY id DESC LIMIT 1;`,
            values: [bag.identificationCode]
        };
        const resultQuery = await database.execute(query);
        assert.exists(resultQuery.rows);
    });

    it('it should get an item using with and select', async () => {
        let bag = {
            identificationCode: '0657276317',
            flighNumber: 'BT154'
        };
        const query = {
            text: `WITH bag_requested AS ( SELECT * FROM bags b WHERE b.identification_code = $1 ORDER BY id DESC LIMIT 1) \
                SELECT * FROM bag_requested;`,
            values: [bag.identificationCode]
        };
        const resultQuery = await database.execute(query);
        assert.exists(resultQuery.rows);
    });

    it('it should insert if not found using with', async () => {
        let bag = {
            identificationCode: '0657276321',
            flighNumber: 'BT154'
        };
        const query = {
            text: `WITH bag_found AS (INSERT INTO bags(identification_code) VALUES($1) ON CONFLICT DO NOTHING RETURNING * )
                SELECT * FROM bag_found;`,
            values: [bag.identificationCode]
        };
        const resultQuery = await database.execute(query);
        assert.exists(resultQuery.rows);
    });
    
    it('it should insert if not found and get item using with and select', async () => {
        let bag = {
            identificationCode: '0657276322',
            flighNumber: 'BT154'
        };
        const query = {
            text: `WITH bag_found AS (INSERT INTO bags(identification_code) VALUES($1) ON CONFLICT DO NOTHING RETURNING * ),
                bag_requested AS (SELECT * FROM bags b WHERE b.identification_code = $1 UNION SELECT * FROM bag_found bf)
                SELECT * FROM bag_requested;`,
            values: [bag.identificationCode]
        };
        const resultQuery = await database.execute(query);
        assert.exists(resultQuery.rows);
    });
});