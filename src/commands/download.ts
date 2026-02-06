import * as yargs from 'yargs';
import * as process from 'process';
import * as console from 'console';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import {deepDiffMapper} from '../utils/diff';
import {readJsonFile, writeJsonFile} from '../utils/file';
import VaultService from '../services/VaultService';

export async function downloadSecrets(argv: yargs.ArgumentsCamelCase) {
    await VaultService.changeContext(argv.instance as string);
    const vaultData = await VaultService.getAllKeys(argv.path as string);
    console.log('Found keys: ' + Object.keys(vaultData).length);
    for (const [key, value] of Object.entries(vaultData)) {
        let filePath: string = process.cwd() + '/var/' + argv.instance + '/' + key + '.json';

        if (fs.existsSync(filePath)) {
            const localFileContent = await readJsonFile(filePath);

            const localFileContentHash = crypto.createHash('md5').update(JSON.stringify(localFileContent), 'utf8').digest('hex');
            const valueHash = crypto.createHash('md5').update(JSON.stringify(value), 'utf8').digest('hex');

            if (localFileContentHash !== valueHash) {
                const diff = deepDiffMapper.map(value, localFileContent);
                if (diff.type !== 'unchanged') {
                    console.warn('Overwrite content for: ' + key);
                    console.table(diff.data);
                }
            }
        }
        console.log('Write content to: ' + filePath);
        await writeJsonFile(filePath, value);
    }
}
