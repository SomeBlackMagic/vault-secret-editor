
const dirTree = require('directory-tree');
const util = require('util');

import * as yargs from 'yargs';
import {Helpers} from './Helpers';
import * as process from 'process';
import * as console from 'console';
import VaultUtility from './VaultUtility';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';

export class Logic {
    public static async downloadSecrets(argv: yargs.ArgumentsCamelCase) {
        await VaultUtility.changeContext(argv.instance as string);
        const vaultData = await VaultUtility.getAllKeys(argv.instance as string);

        for (const [key, value] of Object.entries(vaultData)) {
            let filePath:string = process.cwd() + '/var/' + argv.instance + '/' + key + '.json';


            if (fs.existsSync(filePath)) {
                const localFileContent = Helpers.readDataFromFile(filePath);

                const localFileContentHash  = crypto.createHash('md5').update(JSON.stringify(localFileContent), 'utf8').digest('hex');
                const valueHash = crypto.createHash('md5').update(JSON.stringify(value), 'utf8').digest('hex');

                if (localFileContentHash !== valueHash) {
                    console.warn('Overwrite content for: ' + key);
                    const diff = deepDiffMapper.map(value, localFileContent);
                    console.table(diff);
                }



            }
            await Helpers.writeDataToFile(filePath, JSON.stringify(value, Logic.nestedParse.bind(this), 4));
        }
    }

    private static nestedParse(key: string, value: any| Object): any {
        if (key !== '') {
            if (typeof value === 'string' && isNaN(parseInt(value))) {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            }
        }
        return value;
    }

    public static async checkDiff(argv: yargs.ArgumentsCamelCase) {

        console.log('Grab data from vault...');
        await VaultUtility.changeContext(argv.instance as string);
        const vaultData = await VaultUtility.getAllKeys(argv.path as string);

        const filePath:string = process.cwd() + '/var/' + argv.instance + '/';

        console.log('Fetch local changes...');
        let localChanges = {};
        dirTree(filePath + argv.path.toString(), {extensions:/\.json$/}, (item, PATH, stats) => {
            const secretPath = PATH.replace(filePath, '').replace('.json', '');
            try {
                localChanges[secretPath] = Helpers.readDataToFile(item.path);
            } catch (error) {
                console.error('Can not read file: ' + item.path);
                console.error(error);
                process.exit(1);
            }
        });
        console.log(util.inspect(deepDiffMapper.map(vaultData, localChanges), {showHidden: false, depth: null, colors: true}));

    }

    public static async applyChanges(argv: yargs.ArgumentsCamelCase) {
        console.log('Grab data from vault...');
        await VaultUtility.changeContext(argv.instance as string);
        const vaultData = await VaultUtility.getAllKeys(argv.path as string);


        console.log('Fetch local changes...');
        let localChanges = {};
        const filePath:string = process.cwd() + '/var/' + argv.instance + '/';


        dirTree(filePath + argv.path.toString(), {extensions:/\.json$/}, (item, PATH, stats) => {
            const secretPath = PATH.replace(filePath, '').replace('.json', '');
            try {
                localChanges[secretPath] =  Helpers.readDataToFile(item.path);
            } catch (error) {
                console.error('Can not read file:' + item.path);
                console.error(error);
                process.exit(0);
            }
        });

        const changes = deepDiffMapper.map(vaultData, localChanges);

        if (changes.type === 'updated') {
            for (const [key, value] of Object.entries(changes.data)) {
                // @ts-ignore
                console.log('Key ' + key + ' -> ' + value?.type);
                // @ts-ignore
                switch (value?.type) {
                    case 'updated':
                    case 'created':
                        await VaultUtility.writeChangesToTempFile(argv.instance as string, key, localChanges[key]);
                        break;
                    case 'deleted':
                        await VaultUtility.deleteKey(argv.instance as string, key);
                        break;
                    case 'unchanged':
                        break;

                }
            }
            await VaultUtility.flushData(argv.instance as string);
        }
    }

}


let deepDiffMapper = function () {
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