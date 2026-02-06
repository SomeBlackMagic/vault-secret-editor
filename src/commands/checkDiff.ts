import * as yargs from 'yargs';
import * as process from 'process';
import * as console from 'console';
import * as util from 'node:util';
import {deepDiffMapper} from '../utils/diff';
import VaultService from '../services/VaultService';
import {getLocalChanges} from './common';

export async function checkDiff(argv: yargs.ArgumentsCamelCase) {

    console.log('Grab data from vault...');
    await VaultService.changeContext(argv.instance as string);
    const vaultData = await VaultService.getAllKeys(argv.path as string);

    const filePath: string = process.cwd() + '/var/' + argv.instance + '/';

    console.log('Fetch local changes...');

    let localChanges = await getLocalChanges(filePath, argv);

    console.log(util.inspect(deepDiffMapper.map(vaultData, localChanges), {showHidden: false, depth: null, colors: true}));

}
