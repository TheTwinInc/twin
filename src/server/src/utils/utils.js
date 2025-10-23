(function () {
    const os = require('os');
    const _ = require('lodash');
    const exec = require('child_process').exec;
    const execSync = require('child_process').execSync;
    const spawn = require('child_process').spawn;
    const bcrypt = require('bcryptjs');

    const _psToUTF8 = '$OutputEncoding = [System.Console]::OutputEncoding = [System.Console]::InputEncoding = [System.Text.Encoding]::UTF8 ; ';

    module.exports.bufferToSring = bufferToSring;
    module.exports.bufferInt16BEToSring = bufferInt16BEToSring;
    module.exports.bufferInt16LEToSring = bufferInt16LEToSring;
    module.exports.bufferInt32BEToSring = bufferInt32BEToSring;
    module.exports.bufferInt32LEToSring = bufferInt32LEToSring;
    module.exports.bufferFloatBEToSring = bufferFloatBEToSring;
    module.exports.bufferFloatLEToSring = bufferFloatLEToSring;
    module.exports.bufferBitsArrayToSring = bufferBitsArrayToSring;
    module.exports.camelizeKeys = camelizeKeys;

    module.exports.exec = exec;
    module.exports.execSync = execSync;
    module.exports.powerShell = powerShell;

    module.exports.extractPassword = extractPassword;
    module.exports.verifyPassword = verifyPassword;
    module.exports.hash = hash;

    module.exports.throwError = throwError;

    

    function camelizeKeys(obj) {
        if (Array.isArray(obj)) {
        return obj.map(v => camelizeKeys(v));
        } else if (_.isPlainObject(obj)) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [_.camelCase(key)]: camelizeKeys(obj[key]),
            }),
            {},
        );
        }
        return obj;
    }

    function bufferToSring(buffer, telegram) {
        return buffer.toString('utf8', telegram.start, telegram.start + telegram.bytes);
    }

    function bufferInt16BEToSring(buffer, telegram) {
        return buffer.readInt16BE(telegram.start).toString();
    }

    function bufferInt16LEToSring(buffer, telegram) {
        return buffer.readInt16LE(telegram.start).toString();
    }

    function bufferInt32BEToSring(buffer, telegram) {
        return buffer.readInt32BE(telegram.start).toString();
    }

    function bufferInt32LEToSring(buffer, telegram) {
        return buffer.readInt32LE(telegram.start).toString();
    }

    function bufferFloatBEToSring(buffer, telegram) {
        return buffer.readFloatBE(telegram.start).toString();
    }

    function bufferFloatLEToSring(buffer, telegram) {
        return buffer.readFloatLE(telegram.start).toString();
    }

    function bufferBitsArrayToSring(buffer, telegram, delimiter, reverse) {
        let byteArray = new Uint8Array(telegram.bytes);
        for (let index = 0; index < byteArray.length; index++) {
            byteArray[index] = buffer.readUInt8(telegram.start + index);
        }
        let bitArray = new BitArray(byteArray);
        return bitArray.toString(delimiter, reverse);
    }

    function getBits(number, length) {
        var text = '';
        for (var i = length - 1; i > -1; --i) {
            text += 0x01 & (number >> i);
        }
        return text;
    }

    function getBitsReverse(number, length) {
        var text = '';
        for (var i = 0; i <= length - 1; i++) {
            text += 0x01 & (number >> i);
        }
        return text;
    }
    
    function BitArray(byteArray) {
        this.getSize = function() {
            return 8 * byteArray.length;
        };

        this.getBit = function(index) {
            var byteIndex = Math.floor(index / 8);
            var bitIndex = index - 8 * byteIndex;
            var byteValue = byteArray[byteIndex];
            if (byteValue < 0 || byteValue > 255) {
                throw new Error('Array item must be byte (in range: 0-255).');
            }
            var bitValue = (byteValue >>> bitIndex) & 0x01;
            return bitValue;
        };

        this.setBit = function(index, value) {
            var byteIndex = Math.floor(index / 8);
            var bitIndex = index - 8 * byteIndex;
            var byteValue = byteArray[byteIndex];
            if (byteValue < 0 || byteValue > 255) {
                throw new Error('Array item must be byte (in range: 0-255).');
            }
            var maskValue = 0x01 << bitIndex;
            byteArray[byteIndex] = value ? (byteValue | maskValue) : (byteValue & ~maskValue);
        };

        this.toString = function(delimiter, reverse) {
            if (delimiter == null) {
                delimiter = ' ';
            }
            if (reverse == null) {
                reverse = false;
            }
            var result = '';
            for (var i = 0; i < byteArray.length; ++i) {
                if (i > 0) {
                    result += delimiter;
                }
                var byte = byteArray[i];
                if (byte < 0 || byte > 255) {
                    throw new Error('Array item must be byte (in range: 0-255).');
                }
                if(reverse) {
                    result += getBitsReverse(byte, 8);
                } else {
                    result += getBits(byte, 8);
                }
            }
            return result;
        };
    }

    async function powerShell(cmd) {
        let result = '';
        return new Promise((resolve, reject) => {
            try {
                const child = spawn('powershell.exe', ['-Nop', '-NoLogo', '-InputFormat', 'Text', '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', '-'], {
                // const child = spawn('powershell.exe', ['-NoLogo', '-InputFormat', 'Text', '-NoExit', '-ExecutionPolicy', 'Unrestricted', '-Command', '-'], {
                    stdio: 'pipe',
                    windowsHide: true,
                    maxBuffer: 1024 * 20000,
                    encoding: 'UTF-8'
                });
                
                if (child && child.pid) {
                    child.stdout.on('data', function (data) {
                        result = result + data.toString('utf8');
                    });
                    child.stderr.on('data', function (data) {
                        child.kill();
                        resolve();
                    });
                    child.on('close', function () {
                        child.kill();
                        resolve(result);
                    });
                    child.on('error', function (error) {
                        child.kill();
                        resolve();
                    });
                    try {
                        child.stdin.write(_psToUTF8 + cmd + os.EOL);
                        child.stdin.write('exit' + os.EOL);
                        child.stdin.end();
                    } catch (error) {
                        child.kill();
                        reject();
                    }
                } else {
                    resolve();
                }
            } catch (error) {
                reject();
            }
        });
    }

    function extractPassword(user, verifyProp) {
        let password;
        password = user[verifyProp];
        
        return password;
    }

    async function verifyPassword(user, password) {
        let passwordMatch = false;
        if (user && user.hash) {
            passwordMatch = await bcrypt.compare(password, user.hash);
        }
        return passwordMatch;
    }

    async function hash(password) {
        return await bcrypt.hash(password, 10);
    }

    function throwError(error) {
        throw new Error(`${error}`);
    }
    
})();