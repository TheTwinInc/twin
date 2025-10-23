(function () {
    module.exports.initialize = initialize;
    module.exports.close = close;
    module.exports.messageHandler = messageHandler;
    module.exports.broadcastMessage = broadcastMessage;

    const http = require('node:http');
    const WebSocketServer = require('ws').WebSocketServer;
    const parse = require('url').parse;
    const log = require('../utils/log');
    const { v4: uuidv4 } = require('uuid');
    const WebSocket = require('ws');
    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config')[env];
    const bags = require('../models/bagsModel');
    const twin = require('../models/twinModel');
    const monitor = require('../models/monitorModel');

    let server;
    let wsServer = {};
    let keepaliveInterval;
    const keepaliveIntervalDelay = config.keepaliveIntervalDelay;

    function initialize() {
        log.debug('WSS: Initialize web socket server service');
        return new Promise((resolve, reject) => {
            try {
                server = http.createServer();
                wsServer['twin'] = new WebSocketServer({ noServer: true });
                wsServer['admin'] = new WebSocketServer({ noServer: true });

                wsServer['twin'].on('connection', async (ws, req) => {
                    let channel = 'twin';
                    log.debug('WSS: Connection on TWIN: ' + JSON.stringify(channel));
                    await onConnection(channel, ws, reject, req);
                });
                wsServer['admin'].on('connection', async (ws, req) => {
                    let channel = 'admin';
                    log.debug('WSS: Connection on ADMIN: ' + JSON.stringify(channel));
                    await onConnection(channel, ws, reject, req);
                });

                server.on('upgrade', function upgrade(request, socket, head) {
                    const { pathname } = parse(request.url);
                    log.debug('WSS: Pathname: ' + JSON.stringify(pathname));
                  
                    if (pathname === '/twin') {
                        if (undefined != wsServer['twin']) {
                            wsServer['twin'].handleUpgrade(request, socket, head, function done(ws) {
                                wsServer['twin'].emit('connection', ws, request);
                            });
                        }
                    } else if (pathname === '/admin') {
                        if (undefined != wsServer['admin']) {
                            wsServer['admin'].handleUpgrade(request, socket, head, function done(ws) {
                                wsServer['admin'].emit('connection', ws, request);
                            });
                        }
                    } else {
                        socket.destroy();
                    }
                });

                server.listen(8010);

                // Remove lost connections
                keepaliveInterval = setInterval(keepalive, 30000);
                resolve(wsServer);
            } catch (error) {
                log.error(error);
                reject();
            }
        });
    }

    async function onConnection(channel, ws, reject, req) {
        const id = uuidv4();
        ws.id = id;
        ws.isAlive = true;

        ws.on('pong', heartbeat);

        ws.on('message', (data, isBinary) => {
            log.debug('WSS: Received data: ' + data);
            messageHandler(wsServer[channel], data.toString(), isBinary, ws);
        });

        ws.on('error', (error) => {
            log.error(`WSS: Error: ${JSON.stringify(error)}`);
            reject(err);
        });

        ws.on('close', (why) => {
            log.info(`WSS: Connection closed: ${getStatusCodeString(why)}`);
        });
    }

    function keepalive() {
        sendPing();
    }

    function sendPing() {
        for (server in wsServer) {
            wss = wsServer[server];
            wss.clients.forEach(function each(ws) {
                if (ws.isAlive === false) {
                    return ws.terminate();
                }
                ws.isAlive = false;
                ws.ping();
            });
        }
    }

    async function sendMessageClient(ws, message, isBinary = false) {
        if (undefined != message.wsId) {
            delete message.wsId;
        }
        ws.send(JSON.stringify(message), { binary: isBinary });
    }

    async function broadcastMessageClients(wss, data, isBinary = false, ws = undefined) {
        try {
            log.debug('WSS: Message to clients: ' + JSON.stringify(data));
            if (undefined != wss && data != null) {
                wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        if (client !== ws) {
                            sendMessageClient(client, data, isBinary);
                        }
                    }
                });
            }
        } catch (error) {
            log.error(error);
        }
    }

    function messageHandler(wss, data, isBinary, ws) {
        try {
            let message = {};
            if (typeof data == "object") {
                message = data;
            } else {
                message = JSON.parse(data);
            }
            log.debug(`WSS: Handle message: ${JSON.stringify(message)}`);
            
            if (message.hasOwnProperty('request')) {
                let request = message.request;
                if ('getBags' == request) {
                    handleGetBags(message, wss, isBinary, ws, data);
                } else if ('getFlights' == request && undefined != message.receiver) {
                    handleGetFlights(message, wss, isBinary, ws);
                } else if ('updateConnectionStatus' == request && undefined != message.receiver) {
                    handleUpdateConnectionStatus(message, wss, isBinary, ws);
                }
            }
        } catch (error) {
            log.error(error);
        }
    }

    function handleGetBags(message, wss, isBinary, ws, data) {
        if (message.receiver == 'client') {
            // TODO Get flights and send in message
            handleClientMessage(message, wss, isBinary, ws, data);
        }
    }

    function handleGetFlights(message, wss, isBinary, ws, data) {
        if (message.receiver == 'client') {
            // TODO Get flights and send in message
            handleClientMessage(message, wss, isBinary, ws, data);
        }
    }

    async function handleUpdateConnectionStatus(message, wss, isBinary, ws, data) {
        // if (message.receiver == 'client') {
        //     // TODO Get flights and send in message
        //     handleClientMessage(message, wss, isBinary, ws, data);
        // }
    }

    function handleClientMessage(message, wss, isBinary, ws) {
        log.debug(`WSS: Handle client message: ${JSON.stringify(message)}`);
        if (undefined != message.wsId && message.wsId != '') {
            let wsId = message.wsId;
            log.debug(`WSS: Client id: ${wsId}`);
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    if (client.id == wsId) {
                        sendMessageClient(client, message, isBinary);
                    }
                }
            });
        } else {
            broadcastMessageClients(wss, message, isBinary, ws);
        }
    }

    function close(wsServers) {
        log.debug(`WSS: Close: web socket server service`);
        return new Promise((resolve, reject) => {
            try {
                clearInterval(keepaliveInterval);
                for (server in wsServers) {
                    wss = wsServers[server];
                    terminateClients(wss);
                }
                resolve();
            } catch (error) {
                log.error(error);
                reject(error);
            }
        });
    }

    function heartbeat() {
        this.isAlive = true;
    }

    function broadcastMessage(message, isBinary) {
        for (server in wsServer) {
            wss = wsServer[server];
            wss.clients.forEach(function each(ws) {
                if (ws.readyState === WebSocket.OPEN) {
                    sendMessageClient(ws, message, isBinary);
                }
            });
        }
    }

    function terminateClients(wss) {
        wss.clients.forEach(function each(ws) {
            if (ws.isAlive === true) {
                ws.send(`WSS: Close connection from server.`);
                return ws.terminate();
            }
        });
    }

    let specificStatusCodeMappings = {
        '1000': 'Normal Closure',
        '1001': 'Going Away',
        '1002': 'Protocol Error',
        '1003': 'Unsupported Data',
        '1004': '(For future)',
        '1005': 'No Status Received',
        '1006': 'Abnormal Closure',
        '1007': 'Invalid frame payload data',
        '1008': 'Policy Violation',
        '1009': 'Message too big',
        '1010': 'Missing Extension',
        '1011': 'Internal Error',
        '1012': 'Service Restart',
        '1013': 'Try Again Later',
        '1014': 'Bad Gateway',
        '1015': 'TLS Handshake'
    };
    
    function getStatusCodeString(code) {
        if (code >= 0 && code <= 999) {
            return '(Unused)';
        } else if (code >= 1016) {
            if (code <= 1999) {
                return '(For WebSocket standard)';
            } else if (code <= 2999) {
                return '(For WebSocket extensions)';
            } else if (code <= 3999) {
                return '(For libraries and frameworks)';
            } else if (code <= 4999) {
                return '(For applications)';
            }
        }
        if (typeof(specificStatusCodeMappings[code]) !== 'undefined') {
            return specificStatusCodeMappings[code];
        }
        return '(Unknown)';
    }
}());