(function () {
    const net = require('net');
    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config')[env];
    const log = require('../utils/log');
    const _ = require('lodash');
    const wss = require('./webSocketServer.js');
    const utils = require('../utils/utils');
    const { EventEmitter } = require('events');

    module.exports.initialize = initialize;
    module.exports.close = close;
    module.exports.messageHandler = messageHandler;

    let server;
    let sockets = [];
    let webSocketServers;
    let clientSocket;
    let wdInterval;
    let emitter;
    let messageIdNumber = 0;

    const MessageType = Object.freeze({
        LOGIN_RQST: 1,
        LOGIN_ACCEPT: 2,
        LOGIN_REJECT: 3,
        DATA: 4,
        ACK_DATA: 5,
        ACK_MSG: 6,
        NAK_MSG: 7,
        STATUS: 8,
        DATA_ON: 9,
        DATA_OFF: 10,
        LOG_OFF: 11
    })

    // function initialize(wsServers) {
    function initialize() {
        emitter = new EventEmitter();
        log.info('BS: Initialize bsm server');
        return new Promise(async (resolve, reject) => {
            try {
                server = net.createServer((socket) =>
                    // Catching ECONNRESET
                    socket.on("error", (err) =>{
                        log.error(`BS: ${err.code}`);
                    })
                );
                server
                .listen(config.bsm.server.port, config.bsm.server.ip)
                .on('listening', () => {
                    try {
                        log.info('BS: Listening bsm on port ' + config.bsm.server.port + '...');  
                    } catch (error) {
                        emitter.emit('error', error);
                        log.error(`BS: On listening ${error}`);
                        reject(error);
                    }
                })
                .on('connection', function(sock) {
                    try {
                        emitter.emit('connect');
                        clientSocket = sock;
                        log.info('BS: Client connected: ' + sock.remoteAddress + ':' + sock.remotePort);
                        sockets.push(sock);
                        clientSocket.on('data', async function(data) {
                            try {
                                // log.debug(`BS: Data received from bsm client: ${data.toString().replace(/\s/g, "")}`);
                                await messageHandler(data);
                            } catch (error) {
                                log.error(`BS: OnData ${error}`);
                                reject(error);    
                            }
                        })
                        .on('close', function(data) {
                            try {
                                emitter.emit('close');
                                let index = sockets.findIndex(function(o) {
                                    return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
                                })
                                if (index !== -1) {
                                    sockets.splice(index, 1)
                                };
                                log.info('BS: Client disconnected: ');  
                                clientSocket = null;
                                clearInterval(wdInterval);
                            } catch (error) {
                                emitter.emit('error', error);
                                log.error(`BS: OnClose ${error}`);
                                reject(error);
                            }
                        })
                        .on('error', function(error) {
                            emitter.emit('error', error);
                            log.error(`BS: Socket error ${error}`);
                            reject(error);
                        });
                    } catch (error) {
                        emitter.emit('error', error);
                        log.error(`BS: OnConnection ${error}`);
                        reject(error);
                    }

                    // Add watch dog
                    wdInterval = setInterval(() => {
                        if (undefined != clientSocket){
                            sendStatus();
                        } else {
                            clearInterval(this);
                        }
                    }, config.bsm.server.watchDog);
                })
                .on('error', (error) => {
                    emitter.emit('error', error);
                    if(undefined != server) {
                        server.close();
                    }
                    if (error.code == 'EADDRINUSE') {
                        log.error('BS: Address in use, retrying...');
                    }
                    if (error.code == 'ECONNRESET') {
                        log.error('BS: Reset client...');
                    } else {
                        log.error(`BS: Undefined error ${error}`);
                    }
                    reject(error);
                })
                .on('drop', (error) => {
                    emitter.emit('error', error);
                    if (error.code == 'ECONNRESET') {
                        log.error('BS: Reset client...');
                    } else {
                        log.error(`BS: Undefined error ${error}`);
                    }
                    reject(error);
                });
                resolve(emitter);
            } catch (error) {
                emitter.emit('error', error);
                if (error.code == 'ECONNRESET') {
                    log.error('BS: Reset client...');
                } else {
                    log.error(`BS: Undefined ${error}`);
                }
                reject(error);
            }
        });
    }

    function close() {
        log.debug('BS: Close bsm server');
        return new Promise((resolve, reject) => {
            try {
                if (undefined != server) {
                    server.close((error) => {
                        if (error) {
                            emitter.emit('error', error);
                            log.error(`BS: Close server error ${error}`);
                            reject(error);
                        } else {
                            resolve();
                        }
                        emitter.emit('close');
                    });
                } else {
                    emitter.emit('close');
                    return reject();
                }
            } catch (error) {
                emitter.emit('error', error);
                log.error(`BS: On listening error ${error}`);
                reject(error);
            }
        })
    }

    function sendBsm(addressStamp, message) {
        return new Promise(async (resolve, reject) => {
            try {
                let commandRes = true;
                const standardMessageId = 'BSM';
                const endOfMessage = 'ENDBSM';

                let messageContent = serializeTelegram(addressStamp, standardMessageId, message, endOfMessage);
                let messageHeader = getHeader(messageContent.length, MessageType['DATA']);
                let telegram = Buffer.concat([messageHeader, Buffer.from(messageContent, 'utf8')]);

                await writeTelegram(telegram);

                resolve(commandRes);
            } catch (error) {
                log.error(`BS: Send bsm error ${error}`);
                reject(error);
            }
        });
    }

    function sendStatus() {
        return new Promise(async (resolve, reject) => {
            try {
                let commandRes = true;

                let messageHeader = getHeader(0, MessageType['STATUS']);
                log.debug(`BS: STATUS`);
                let telegram = Buffer.allocUnsafe(messageHeader.length);
                telegram = messageHeader;

                await writeTelegram(telegram);

                resolve(commandRes);
            } catch (error) {
                log.error(`BS: Send bsm error ${error}`);
                reject(error);
            }
        });
    }

    async function writeTelegram(telegram) {
        if (undefined != clientSocket) {
            // log.debug(`BS: Telgram ${telegram}`);
            await clientSocket.write(telegram);
        }
    }

    function sendLoginAnswer(accept) {
        return new Promise(async (resolve, reject) => {
            try {
                let commandRes = true;
                let messageType = MessageType['LOGIN_REJECT'];
                if (accept) {
                    messageType = MessageType['LOGIN_ACCEPT'];
                }
                let messageHeader = getHeader(0, messageType);
                let telegram = Buffer.allocUnsafe(messageHeader.length);
                telegram = messageHeader;

                // log.debug('BS: Login Answer Telegram: ' + (telegram));
                await writeTelegram(telegram);
                resolve(commandRes);
            } catch (error) {
                log.error(error);
                reject(error);
            }
        });
    }

    function sendDataAnswer(acknowledge) {
        return new Promise(async (resolve, reject) => {
            try {
                let commandRes = true;
                let messageType = MessageType['ACK_MSG'];
                if (!acknowledge) {
                    messageType = MessageType['NAK_MSG'];
                }
                let messageHeader = getHeader(0, messageType);
                let telegram = Buffer.allocUnsafe(messageHeader.length);
                telegram = messageHeader;

                await writeTelegram(telegram);
                resolve(commandRes);
            } catch (error) {
                log.error(error);
                reject(error);
            }
        });
    }

    function getHeader(messageLength, messageType) {
        const version = 2;
        // let header = '';
        const header = Buffer.allocUnsafe(20);
        try {
            header.write('LONASI01', 'utf8');
            header.writeUInt16LE(version, 8);
            header.writeUInt16LE(messageType, 10);
            header.writeUInt16LE(messageIdNumber, 12);
            header.writeUInt16LE(messageLength, 14);
            header.writeUInt32LE(0, 16);

            if (messageIdNumber < 65535) {
                messageIdNumber ++;
            } else {
                messageIdNumber = 0;
            } 
        } catch (error) {
            log.error(`BS: Header ${error}`);
        } finally {
            return header;
        }
    }

    function serializeTelegram(addressStamp, standardMessageId, messageContent, endOfMessage) {
        let telegram = '';
        try {
            let endOfLine = '\r\n';
            let messageElements = _.split(messageContent,'\\');
        
            telegram = telegram.concat(addressStamp);
            telegram = telegram.concat(endOfLine);
            telegram = telegram.concat(standardMessageId);
            telegram = telegram.concat(endOfLine);
            messageElements.forEach( (element) => {
                telegram = telegram.concat(element);
                telegram = telegram.concat(endOfLine);
            });
            telegram = telegram.concat(endOfMessage);
            telegram = telegram.concat(endOfLine);
    
            // return telegram;
        } catch (error) {
            log.error(`BS: Serialize telegram ${error}`);
        } finally {
            return telegram;
        }
    }

    function deserializeTelegram(telegram) {
        let message = {
            applicationId : "",
            version : "",
            type : "",
            messageIdNumber : "",
            dataLength : "",
            data : ""
        };
        try {
            let buffer = Buffer.from(telegram);
            
            let telegramStructure = {
                applicationId :         {start : 0, bytes : 8},
                version :               {start : 8, bytes : 2},
                type :                  {start : 10, bytes : 2},
                messageIdNumber :       {start : 12, bytes : 2},
                dataLength :            {start : 14, bytes : 2},
                reserved :              {start : 16, bytes : 4},
                data :                  {start : 20, bytes : 0},
            }
    
            
            message.applicationId = utils.bufferToSring(buffer, telegramStructure.applicationId);
            message.version = utils.bufferInt16LEToSring(buffer, telegramStructure.version);
            message.type = utils.bufferInt16LEToSring(buffer, telegramStructure.type);
            message.messageIdNumber = utils.bufferInt16LEToSring(buffer, telegramStructure.messageIdNumber);
            message.dataLength = utils.bufferInt16LEToSring(buffer, telegramStructure.dataLength);
            
            if (message.dataLength > 0 ) {
                telegramStructure.data.bytes = message.dataLength;
                message.data = utils.bufferToSring(buffer, telegramStructure.data);
            }
        } catch (error) {
            log.error(`BS: Deserialize telegram ${error}`);
        } finally {
            return message;
        }
    }

    function parseDataMessage(data) {
        try {
            log.info(`BS: Data message: ${data}`);
            // TODO save bpm in database
        } catch (error) {
            log.error(`BS: Parse data message ${error}`);
        } finally {
            return message;
        }
    }

    async function messageHandler(telegram) {
        const addressStamp = 'UB1';
        try {
            // log.debug(`BS: Message from bsm client: ${JSON.stringify(telegram)}`);
            // Generator message
            if(undefined != telegram.standardMessageId) {
                if (telegram.standardMessageId == 'BSM') {
                    sendBsm(addressStamp, telegram.messageContent);
                }
            // Client message
            } else {
                message = deserializeTelegram(telegram);
                // log.debug(`BS: Deserialized message: ${JSON.stringify(message)}`);
                if (message.type == MessageType['LOGIN_RQST']) {
                    sendLoginAnswer(true);
                } else if (message.type == MessageType['DATA']) {
                    let parsedMessage = parseDataMessage(message.data);
                    sendDataAnswer(acknowledge = true);
                } else if (message.type == MessageType['ACK_DATA']) {
                    let parsedMessage = parseDataMessage(message.data);
                    sendDataAnswer(acknowledge = parsedMessage);
                }
            }
        } catch (error) {
            log.error(`BS: Message handler ${error}`);
        }
    }
})();