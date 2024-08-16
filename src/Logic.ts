import * as directoryTree from 'directory-tree';
import * as yargs from 'yargs';
import {deepDiffMapper, Helpers} from './Helpers';
import * as process from 'process';
import * as console from 'console';
import VaultUtility from './VaultUtility';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import * as util from 'node:util';

export class Logic {
    public static async downloadSecrets(argv: yargs.ArgumentsCamelCase) {
        await VaultUtility.changeContext(argv.instance as string);
        const vaultData = await VaultUtility.getAllKeys(argv.path as string);
        console.log('Found keys: ' + Object.keys(vaultData).length);
        for (const [key, value] of Object.entries(vaultData)) {
            let filePath:string = process.cwd() + '/var/' + argv.instance + '/' + key + '.json';


            if (fs.existsSync(filePath)) {
                const localFileContent = await Helpers.readJsonFile(filePath);

                const localFileContentHash  = crypto.createHash('md5').update(JSON.stringify(localFileContent), 'utf8').digest('hex');
                const valueHash = crypto.createHash('md5').update(JSON.stringify(value), 'utf8').digest('hex');

                if (localFileContentHash !== valueHash) {
                    console.warn('Overwrite content for: ' + key);
                    const diff = deepDiffMapper.map(value, localFileContent);
                    console.table(diff.data);
                }
            }
            console.log('Write content to: ' + filePath);
            await Helpers.writeJsonFile(filePath, value);
        }
    }

    public static async checkDiff(argv: yargs.ArgumentsCamelCase) {

        console.log('Grab data from vault...');
        await VaultUtility.changeContext(argv.instance as string);
        const vaultData = await VaultUtility.getAllKeys(argv.path as string);

        const filePath:string = process.cwd() + '/var/' + argv.instance + '/';

        console.log('Fetch local changes...');

        let localChanges = await Logic.getLocalChanges(filePath, argv);

        console.log(util.inspect(deepDiffMapper.map(vaultData, localChanges), {showHidden: false, depth: null, colors: true}));

    }

    public static async applyChanges(argv: yargs.ArgumentsCamelCase) {
        console.log('Grab data from vault...');
        await VaultUtility.changeContext(argv.instance as string);
        const vaultData = await VaultUtility.getAllKeys(argv.path as string);

        console.log('Fetch local changes...');
        const filePath:string = process.cwd() + '/var/' + argv.instance + '/';

        let localChanges = await Logic.getLocalChanges(filePath, argv);


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

    private static async getLocalChanges(filePath: string, argv:any) {
        let localChanges = {};

        const promises: Promise<void>[] = [];

        directoryTree(filePath + argv.path.toString(), {extensions: /\.json$/}, (item, PATH, stats) => {
            const secretPath = PATH.replace(filePath, '').replace('.json', '');

            const promise = Helpers.readJsonFile(item.path)
                .then((data) => {
                    localChanges[secretPath] = data;
                })
                .catch((error) => {
                    console.error('Cannot read file:' + item.path);
                    console.error(error);
                    process.exit(0); // Выход в случае ошибки
                });

            promises.push(promise);
        });

        await Promise.all(promises);
        return localChanges;
    }

}