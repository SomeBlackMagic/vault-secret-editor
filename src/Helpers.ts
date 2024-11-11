
import {exec, spawn} from 'child_process';
import * as process from 'node:process';
import VaultNormalizer from './VaultNormalizer';
import * as path from 'node:path';
import * as fse from 'fs-extra';

const debug = require('debug')('helpers');

export class Helpers {
    public static async spawnChildProcess(command: string, args: string[], pipeLogs: boolean = false, logPrefix: string = ''): Promise<string> {
        debug('SpawnChildProcess: ' + command + ' ' + args.join(' '));
        return new Promise<any>((resolve, reject) => {

            const process = spawn(command, args.filter((item) => {
                return item !== '';
            }));
            let stdout: string = '';
            process.stderr.on('data', (arrayBuffer) => {
                const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                data.forEach((item, index) => {
                    if (item !== '' && item !== '\r') {
                        require('debug')('helpers:spawnChildProcess:' + (logPrefix === '' ? command : logPrefix) + ':stderr')(item.replace(/(?:\\[rn]|[\r\n]+)+/g, ''));
                    }
                });

            });

            if (pipeLogs === true) {
                process.stdout.on('data', (arrayBuffer) => {
                    const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                    data.forEach((item, index) => {
                        if (item !== '') {
                            console.log(logPrefix + ' ' + item);
                        }
                    });

                });
            } else {
                process.stdout.on('data', (arrayBuffer) => {
                    const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                    data.forEach((item, index) => {
                        if (item !== '') {
                            stdout += item;
                        }
                    });

                });
            }
            process.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
                if ((code === 0 || code === 1)) {
                    resolve(stdout);
                } else if (signal === 'SIGINT') {
                    resolve('{}');
                } else {
                    reject(new Error('command failed. Code: ' + code));
                }
            });

        });
    }
    public static async execChildProcess(command: string, pipeLogs?: boolean, logPrefix?: string): Promise<string> {

        return new Promise<any>((resolve, reject) => {
            const process = exec(command);
            let stdout: string = '';
            if (pipeLogs === true) {
                process.stdout.on('data', (arrayBuffer) => {
                    const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                    data.forEach((item, index) => {
                        if (item !== '') {
                            console.log(logPrefix + ' ' + item);
                        }
                    });

                });
                process.stderr.on('data', (arrayBuffer) => {
                    const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                    data.forEach((item, index) => {
                        if (item !== '') {
                            console.error(item);
                        }
                    });

                });
            } else {
                process.stdout.on('data', (arrayBuffer) => {
                    const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                    data.forEach((item, index) => {
                        if (item !== '') {
                            stdout += item;
                        }
                    });

                });
            }
            process.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
                if ((code === 0 || code === 1)) {
                    resolve(stdout);
                } else if (signal === 'SIGINT') {
                    resolve('{}');
                } else {
                    reject(new Error('command failed. Code: ' + code));
                }
            });

        });
    }



    public static async writeJsonFile(filePath:string, data: Object): Promise<any> {
        const dir = path.dirname(filePath);
        await fse.ensureDir(dir);

        return fse.writeJson(filePath, data, {
            replacer: VaultNormalizer.denormilize.bind(this),
            spaces: 4
        });
    }


    public static async readJsonFile(filePath: string): Promise<Object> {
        const result =  await fse.readJson(filePath);
        return VaultNormalizer.normilize(result);

    }
}

export let deepDiffMapper = function () {
    return {
        VALUE_CREATED: 'created',
        VALUE_UPDATED: 'updated',
        VALUE_DELETED: 'deleted',
        VALUE_UNCHANGED: 'unchanged',

        map: function(obj1, obj2): {type: string, localValue?: any, remoteValue?: any, data?: any|object }  {
            if (this.isFunction(obj1) || this.isFunction(obj2)) {
                throw 'Invalid argument. Function given, object expected.';
            }
            if (this.isValue(obj1) || this.isValue(obj2)) {
                const type = this.compareValues(obj1, obj2);
                if (type === this.VALUE_UPDATED) {
                    return {
                        type: type,
                        localValue: obj2,
                        remoteValue: obj1,
                    };
                }
                if (type === this.VALUE_UNCHANGED) {
                    return {
                        type: type
                    };
                }

                return {
                    type: type,
                    data: obj1 === undefined ? obj2 : obj1,
                };
            }

            let diff = {};
            let hasChanges = false;

            for (let key in obj1) {
                if (this.isFunction(obj1[key])) {
                    continue;
                }

                let value2 = obj2 !== undefined ? obj2[key] : undefined;

                let childDiff = this.map(obj1[key], value2);
                diff[key] = childDiff;

                if (childDiff.type !== this.VALUE_UNCHANGED) {
                    hasChanges = true;
                }
            }

            for (let key in obj2) {
                if (this.isFunction(obj2[key]) || diff[key] !== undefined) {
                    continue;
                }

                let childDiff = this.map(undefined, obj2[key]);
                diff[key] = childDiff;

                if (childDiff.type !== this.VALUE_UNCHANGED) {
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                return {
                    type: this.VALUE_UPDATED,
                    data: diff
                };
            } else {
                return {
                    type: this.VALUE_UNCHANGED,
                    // data:
                };
            }
        },
        isBoolean: function(obj) {
            return obj === true || obj === false || obj === 'true' || obj === 'false';
        },
        compareValues: function (value1, value2) {
            if (this.isBoolean(value1) || this.isBoolean(value2)) {
                if (value1.toString() === value2.toString()) {
                    return this.VALUE_UNCHANGED;
                }
            }
            if (value1 === value2) {
                return this.VALUE_UNCHANGED;
            }
            if (this.isDate(value1) && this.isDate(value2) && value1.getTime() === value2.getTime()) {
                return this.VALUE_UNCHANGED;
            }
            if (value1 === undefined) {
                return this.VALUE_CREATED;
            }
            if (value2 === undefined) {
                return this.VALUE_DELETED;
            }
            return this.VALUE_UPDATED;
        },

        isFunction: function (x) {
            return Object.prototype.toString.call(x) === '[object Function]';
        },

        isArray: function (x) {
            return Object.prototype.toString.call(x) === '[object Array]';
        },

        isDate: function (x) {
            return Object.prototype.toString.call(x) === '[object Date]';
        },

        isObject: function (x) {
            return Object.prototype.toString.call(x) === '[object Object]';
        },

        isValue: function (x) {
            return !this.isObject(x) && !this.isArray(x);
        }
    };
}();