
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


export enum DiffType {
    CREATED = 'created',
    UPDATED = 'updated',
    DELETED = 'deleted',
    UNCHANGED = 'unchanged'
}

export interface DiffResult {
    type: DiffType;
    localValue?: any;
    remoteValue?: any;
    data?: any | object;
}

export class DeepDiffMapper {

    public map(obj1: any, obj2: any): DiffResult {
        if (this.isFunction(obj1) || this.isFunction(obj2)) {
            throw new Error('Invalid argument. Function given, object expected.');
        }

        if (this.isValue(obj1) || this.isValue(obj2)) {
            const type = this.compareValues(obj1, obj2);

            if (type === DiffType.UPDATED) {
                return {
                    type: type,
                    localValue: obj2,
                    remoteValue: obj1,
                };
            }

            if (type === DiffType.UNCHANGED) {
                return { type: type };
            }

            return {
                type: type,
                data: obj1 === undefined ? obj2 : obj1,
            };
        }

        const diff: { [key: string]: DiffResult } = {};
        let hasChanges = false;

        for (const key in obj1) {
            if (this.isFunction(obj1[key])) {
                continue;
            }

            const value2 = obj2 !== undefined ? obj2[key] : undefined;
            const childDiff = this.map(obj1[key], value2);
            diff[key] = childDiff;

            if (childDiff.type !== DiffType.UNCHANGED) {
                hasChanges = true;
            }
        }

        for (const key in obj2) {
            if (this.isFunction(obj2[key]) || diff[key] !== undefined) {
                continue;
            }

            const childDiff = this.map(undefined, obj2[key]);
            diff[key] = childDiff;

            if (childDiff.type !== DiffType.UNCHANGED) {
                hasChanges = true;
            }
        }

        return hasChanges
            ? { type: DiffType.UPDATED, data: diff }
            : { type: DiffType.UNCHANGED };
    }

    private isBoolean(obj: any): boolean {
        return obj === true || obj === false || obj === 'true' || obj === 'false';
    }

    private compareValues(value1: any, value2: any): DiffType {
        if (value1 === undefined) {
            return DiffType.CREATED;
        }

        if (value2 === undefined) {
            return DiffType.DELETED;
        }

        if (this.isBoolean(value1) || this.isBoolean(value2)) {
            if (value1.toString() === value2.toString()) {
                return DiffType.UNCHANGED;
            }
        }

        if (value1 === value2) {
            return DiffType.UNCHANGED;
        }

        if (this.isDate(value1) && this.isDate(value2) && value1.getTime() === value2.getTime()) {
            return DiffType.UNCHANGED;
        }

        return DiffType.UPDATED;
    }

    private isFunction(x: any): boolean {
        return Object.prototype.toString.call(x) === '[object Function]';
    }

    private isArray(x: any): boolean {
        return Object.prototype.toString.call(x) === '[object Array]';
    }

    private isDate(x: any): boolean {
        return Object.prototype.toString.call(x) === '[object Date]';
    }

    private isObject(x: any): boolean {
        return Object.prototype.toString.call(x) === '[object Object]';
    }

    private isValue(x: any): boolean {
        return !this.isObject(x) && !this.isArray(x);
    }
}

export const deepDiffMapper = new DeepDiffMapper();
