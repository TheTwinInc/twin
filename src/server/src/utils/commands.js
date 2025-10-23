(function () {
    const commands = {
        plc: {
            start: {
                name: 'start',
                vars: [
                    { ident:"start", type: 'BOOL', area: 'db', dbnr: 2, start: 0, bit: 3}
    
                ]
            },
            return: {
                name: 'return',
                vars: [
                    { ident: 'return', type: 'BOOL', area: 'db', dbnr: 2, start: 0, bit: 4},
                ]
            },
            stop: {
                name: 'stop',
                vars: [
                    { ident: 'stop', type: 'BOOL', area: 'db', dbnr: 2, start: 0, bit: 1}
                ]
            },
            weight: {
                name: 'weight',
                vars: [
                    { ident: 'weight', type: 'REAL', area: 'db', dbnr: 2, start: 2}
                ],
                unit: 'Kg'
            },
            identificationCode: {
                name: 'identificationCode',
                vars: [
                    { ident: 'identificationCode', type: 'CHAR', area: 'db', dbnr: 2, start: 8, amount: 10 }
                ] 
            },
            authorizationCode: {
                name: 'authorizationCode',
                vars: [
                    { ident: 'authorizationCode', type: 'CHAR', area: 'db', dbnr: 2, start: 18, amount: 16 }
                ] 
            },
            connection: {
                name: 'connection',
                vars: [
                    { ident: 'connection', type: 'BOOL', area: 'db', dbnr: 2, start: 34, bit: 0}
                ]
            },
            actualState: {
                name: 'actualState',
                vars: [
                    { ident: 'actualState', type: 'INT', area: 'db', dbnr: 2, start: 42}
                ]
            },
            previousState: {
                name: 'previousState',
                vars: [
                    { ident: 'previousState', type: 'INT', area: 'db', dbnr: 2, start: 44}
                ]
            },
            idle: {
                name: 'idle',
                vars: [
                    { ident: 'idle', type: 'BOOL', area: 'db', dbnr: 2, start: 46, bit: 0}
                ]
            },
            itemDetected: {
                name: 'itemDetected',
                vars: [
                    { ident: 'itemDetected', type: 'BOOL', area: 'db', dbnr: 2, start: 46, bit: 1}
                ]
            },
            itemValidated: {
                name: 'itemValidated',
                vars: [
                    { ident: 'itemValidated', type: 'BOOL', area: 'db', dbnr: 2, start: 46, bit: 2}
                ]
            },
            itemIdentified: {
                name: 'itemIdentified',
                vars: [
                    { ident: 'itemIdentified', type: 'BOOL', area: 'db', dbnr: 2, start: 46, bit: 3}
                ]
            },
            itemAuthorized: {
                name: 'itemAuthorized',
                vars: [
                    { ident: 'itemAuthorized', type: 'BOOL', area: 'db', dbnr: 2, start: 46, bit: 4}
                ]
            },
            itemTransfered: {
                name: 'itemTransfered',
                vars: [
                    { ident: 'itemTransfered', type: 'BOOL', area: 'db', dbnr: 2, start: 46, bit: 5}
                ]
            },
            demo: {
                name: 'demo',
                vars: [
                    { ident: 'demo', type: 'BOOL', area: 'db', dbnr: 2, start: 28, bit: 0}
                ]
            }
            
        },
        linux: {
            start: {
                name: 'start',
                script: 'sudo systemctl start'
            },
            restart: {
                name: 'return',
                script: 'sudo systemctl restart'
            },
            stop: {
                name: 'stop',
                script: 'sudo systemctl stop'
            },
            enable: {
                name: 'enable',
                script: 'sudo systemctl enable'
            },
            disable: {
                name: 'disable',
                script: 'sudo systemctl disable'
            },
            status: {
                name: 'status',
                script: 'sudo journalctl -f -u'
            },
            isEnabled: {
                name: 'isEnabled',
                script: 'sudo systemctl is-enabled'
            }
        },
        win32: {
            start: {
                name: 'start',
                script: 'Start-Service -Name'
            },
            restart: {
                name: 'restart',
                script: 'Restart-Service -Name'
            },
            stop: {
                name: 'stop',
                script: 'Stop-Service -Name'
            },
            status: {
                name: 'status',
                script: 'Get-Service -Name'
            },
            service: {
                name: 'service',
                script: 'Get-CimInstance -Class Win32_Service -Filter \"Name LIKE',
                postScript: '\" | select Name,Caption,Started,StartMode,ProcessId | fl'
            }
        },
    }

    module.exports = commands;
}());