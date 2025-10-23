// const { concat } = require('lodash');

(function () {
    
    const _ = require('lodash');
    const log = require('../utils/log');
    const utils = require('../utils/utils');
    // const tasks = require('../utils/tasks');

    const stringReplace = new String().replace;
    const stringToLower = new String().toLowerCase;
    const stringSubstr = new String().substr;
    const stringTrim = new String().trim;
    const stringMatch = new String().match;

    let platform = process.platform;

    const linux = (platform === 'linux' || platform === 'android');
    const windows = (platform === 'win32');
    const processes = require('../config/processes')[platform];
    const commands = require('../utils/commands')[platform];
    

    const env = process.env.NODE_ENV || 'development';
    const config = require('../config/config')[env];

    module.exports.getTasks = getTasks;
    module.exports.executeTask = executeTask;
    
    async function getTasks() {
        let result = {};
        try {
            try {
                let data = services();
                result = data;
            } catch (e) {
                log.error(e);
            }
        } catch(error) {
            log.error(error);
            result = {
                error: 'TM: Unable to get tasks.',
            };
        }
        return result;
    }

    async function executeTask(context) {
        let result = {
            'name': context.name,
            'command': context.command,
            'succes': false
        };
        if(linux) {
            result = executeTaskLinux(context);
        }
        if(windows) {
            result = executeTaskWindows(context);
        }
        
        return result;
    }

    function executeTaskLinux(context) {
        let result = false;
        try {
            let command = commands[context.command];
            command['process'] = processes[context.name]['serviceName'];
            // log.debug(`ExecuteCommand: ${JSON.stringify(command)}`);
            let executeStatement = [command.script, command.process].join(' ');
            utils.exec(executeStatement, (err, stdout, stderr) => {
                if (err) {
                    log.error(err);
                } else {
                    log.info(`The stdout Buffer from shell: ${stdout.toString()}`);
                    log.info(`The stderr Buffer from shell: ${stderr.toString()}`);
                    result = true;
                }
            });
        } catch (error) {
            log.error(error);
        }
        return result;
    }

    function executeTaskWindows(context) {
        let result = false;
        // log.debug(`Context: ${JSON.stringify(context)}`);
        try {
            
            // log.debug(`Processes: ${JSON.stringify(processes[context.name]['serviceName'])}`);
            let serviceCommand = commands[context.command];
            let serviceName = processes[context.name]['serviceName'];
            // log.debug(`Service Command: ${JSON.stringify(serviceCommand)}`);
            let command = `${serviceCommand.script} "${serviceName}"`;
            // log.debug(`Process: ${JSON.stringify(process)}`);
            // log.debug(`Command: ${command}`);
            let processStatus = utils.powerShell(command);
            processStatus.then((data) => {
                if (data) {
                    result = true;
                    log.debug(`TM: Data: ${data}`);
                }
            });
        } catch (error) {
            process['running'] = false;
            process['enabled'] = false;
            process['pid'] = null;
            log.error(`TM: Error: ${error}`);
        }
        return result;
    }

    async function services() {
        let services = {}
        if(linux) {
            // let processes = processesLinux;
            getServicesLinux(processes);
            services = (Object.values(processes));
        }
        if (windows) {
            // let processes = processesWindows;
            await getServicesWindows(processes);
            services = Object.values(processes);
        }
        return services;
    }

    async function getServicesWindows(processes) {
        let attribute = '';
        let attributeValue = '';
        attribute.__proto__.replace = stringReplace;
        attribute.__proto__.toLowerCase = stringToLower;
        attribute.__proto__.substr = stringSubstr;
        attribute.__proto__.trim = stringTrim;
        attributeValue.__proto__.match = stringMatch;
        attributeValue.__proto__.replace = stringReplace;
        attributeValue.__proto__.toLowerCase = stringToLower;
        attributeValue.__proto__.trim = stringTrim;

        let promises = [];
        
        let serviceCommand = commands['service'];
        Object.values(processes).forEach(async (process) => {
            try {
                // let command = `Get-CimInstance Win32_Service -Filter "Name LIKE '${process.serviceName}'" | select Name,Caption,Started,StartMode,ProcessId | fl`;
                let command = `${serviceCommand.script} '${process.serviceName}'${serviceCommand.postScript}`;
                let processStatus = utils.powerShell(command);
                promises.push(processStatus);
                processStatus.then((data, error) => {
                    if (!error) {
                        processElements = data.toString().split('\r\n');
                        for (const element of processElements) {
                            if (element != '') {
                                const attributeLine = element.split(':');
                                attribute = attributeLine[0];
                                attributeValue = attributeLine[1];

                                if (undefined != attributeValue) {
                                    attribute = attribute.trim().toLowerCase().replace(/, /g, '|').replace(/,+/g, '|');
                                    attributeValue = attributeValue.trim().toLowerCase().replace(/, /g, '|').replace(/,+/g, '|');

                                    if (attribute == 'started') {
                                        process['running'] = attributeValue.includes('true');
                                    } else if (attribute == 'startmode') {
                                        process['enabled'] = !attributeValue.includes('disabled');
                                    } else if (attribute == 'processid') {
                                        process['pid'] = attributeValue;
                                    }
                                }

                            }
                        }
                    }
                });
            } catch (error) {
                process['running'] = false;
                process['enabled'] = false;
                process['pid'] = null;
                log.error(`TM: Error: ${error}`);
            }
        });
        await Promise.all(promises);
    }

    function getServicesLinux(processes) {
        let attribute = '';
        let attributeValue = '';
        attribute.__proto__.replace = stringReplace;
        attribute.__proto__.toLowerCase = stringToLower;
        attribute.__proto__.substr = stringSubstr;
        attribute.__proto__.trim = stringTrim;
        attributeValue.__proto__.match = stringMatch;

        Object.values(processes).forEach(async (process) => {
            try {
                const processStatus = utils.execSync(`systemctl status "${process['serviceName']}" 2> /dev/null`).toString().split('\n');
                for (const s of processStatus) {
                    const attributeLine = s.split(':');
                    attribute = attributeLine[0];
                    attributeValue = attributeLine[1];
                    attribute = attribute.trim().toLowerCase().replace(/, /g, '|').replace(/,+/g, '|');
                    if (attribute == 'active') {
                        process['running'] = attributeLine[1].includes('active');
                    } else if (attribute == 'main pid') {
                        process['pid'] = +attributeValue.match(/\d+/);
                    }
                }
            } catch (error) {
                process['running'] = false;
                process['PID'] = null;
                log.error(`TM: Error: ${error}`);
            }

            try {
                const processEnabled = utils.execSync(`systemctl is-enabled "${process['serviceName']}" 2> /dev/null`).toString();
                attribute = processEnabled;
                attribute = attribute.trim().toLowerCase().replace(/, /g, '|').replace(/,+/g, '|');
                // log.debug(`TM: Process : ${process['serviceName']}`);
                // log.debug(`TM: Process attribute enabled: ${attribute}`);
                // log.debug(`TM: Process attribute includes enabled: ${attribute.includes('enabled')}`);
                process['enabled'] = attribute.includes('enabled');

            } catch (error) {
                process['enabled'] = false;
                log.error(`TM: Error: ${error}`);
            }
            process['cpu'] = 0;
            process['mem'] = 0;
        });
    }
})();
