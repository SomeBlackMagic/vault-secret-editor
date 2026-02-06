import * as yargs from 'yargs';
import * as process from 'process';
import * as console from 'console';
import {deepDiffMapper} from '../utils/diff';
import VaultService from '../services/VaultService';
import {getLocalChanges} from './common';

export async function applyChanges(argv: yargs.ArgumentsCamelCase) {
    console.log('Grab data from vault...');
    await VaultService.changeContext(argv.instance as string);
    const vaultData = await VaultService.getAllKeys(argv.path as string);

    console.log('Fetch local changes...');
    const filePath: string = process.cwd() + '/var/' + argv.instance + '/';

    let localChanges = await getLocalChanges(filePath, argv);

    const changes = deepDiffMapper.map(vaultData, localChanges);

    if (changes.type === 'updated') {
        for (const [key, value] of Object.entries(changes.data)) {
            // @ts-ignore
            console.log('Key ' + key + ' -> ' + value?.type);
            // @ts-ignore
            switch (value?.type) {
                case 'updated':
                case 'created':
                    await VaultService.writeChangesToTempFile(argv.instance as string, key, localChanges[key]);
                    break;
                case 'deleted':
                    await VaultService.deleteKey(argv.instance as string, key);
                    break;
                case 'unchanged':
                    break;

            }
        }
        await VaultService.flushData(argv.instance as string);
    }
}
