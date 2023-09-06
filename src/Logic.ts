const fse = require('fs-extra');
const dirTree = require('directory-tree');

import * as yargs from 'yargs';
import {Helpers} from './Helpers';
import * as fs from 'fs';
import * as process from 'process';
import * as console from 'console';
import * as path from 'path';

export class Logic {
    public static async downloadSecrets(argv: yargs.ArgumentsCamelCase) {
        await Helpers.spawnChildProcess('safe', ['target'], true);
        console.log('Grab data from vault...');
        let result = await Helpers.spawnChildProcess('safe', ['export', argv.path.toString()]);
        console.log('Parse data...');
        result = JSON.parse(result);

        await fse.remove(process.cwd() + '/var/' + argv.path.toString());

        for (const [key, value] of Object.entries(result)) {
            console.log('write data to file: ./var/' + key + '.json');
            Helpers.writeDataToFile(process.cwd() + '/var/' + key + '.json', JSON.stringify(value, null, 4));
        }
    }

    public static async checkDiff(argv: yargs.ArgumentsCamelCase) {
        await Helpers.spawnChildProcess('safe', ['target'], true);
        console.log('Grab data from vault...');
        let result = await Helpers.spawnChildProcess('safe', ['export', argv.path.toString()]);
        console.log('Parse data...');
        result = JSON.parse(result);
        //
        //
        // fse.writeJsonSync(process.cwd()+'/var/'+argv.path.toString()+'.json', result);
        // let result = fse.readJsonSync(process.cwd()+'/'+argv.path.toString()+'.json');

        console.log('Fetch local changes...');
        let localChanges = {};
        dirTree(process.cwd() + '/var/' + argv.path.toString(), {extensions:/\.json$/}, (item, PATH, stats) => {
            const secretPath = PATH.replace(process.cwd() + '/var/', '').replace('.json', '');
            localChanges[secretPath] =  fse.readJsonSync(item.path);
        });
        console.log(deepDiffMapper.map(localChanges, result));

    }

    public static async applyChanges(argv: yargs.ArgumentsCamelCase) {
        await Helpers.spawnChildProcess('safe', ['target'], true);
        console.log('Fetch local changes...');
        let localChanges = {};
        dirTree(process.cwd() + '/var/' + argv.path.toString(), {extensions:/\.json$/}, (item, PATH, stats) => {
            const secretPath = PATH.replace(process.cwd() + '/var/', '').replace('.json', '');
            localChanges[secretPath] =  fse.readJsonSync(item.path);

        });
        console.log('Write to file...');
        fse.writeJsonSync(process.cwd() + '/var/apply-data.json', localChanges);
        let result = await Helpers.execChildProcess('safe import < ' + process.cwd() + '/var/apply-data.json', true);
        console.log(result);
    }

}


let deepDiffMapper = function () {
    return {
        VALUE_CREATED: 'created',
        VALUE_UPDATED: 'updated',
        VALUE_DELETED: 'deleted',
        VALUE_UNCHANGED: 'unchanged',
        map: function(obj1, obj2) {
            if (this.isFunction(obj1) || this.isFunction(obj2)) {
                throw 'Invalid argument. Function given, object expected.';
            }
            if (this.isValue(obj1) || this.isValue(obj2)) {
                const type = this.compareValues(obj1, obj2);
                if (type === 'updated') {
                    return {
                        type: type,
                        localValue: obj1,
                        remoteValue: obj2,
                    };
                }
                if (type === 'unchanged') {
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
            for (let key in obj1) {
                if (this.isFunction(obj1[key])) {
                    continue;
                }

                let value2 = undefined;
                if (obj2[key] !== undefined) {
                    value2 = obj2[key];
                }

                diff[key] = this.map(obj1[key], value2);
            }
            for (let key in obj2) {
                if (this.isFunction(obj2[key]) || diff[key] !== undefined) {
                    continue;
                }

                diff[key] = this.map(undefined, obj2[key]);
            }

            return diff;

        },
        compareValues: function (value1, value2) {
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
