import {spawnChildProcess, execChildProcess} from '../utils/process';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as console from 'node:console';
import * as fse from 'fs-extra';

export default class VaultService {

    private static openTempFile: string|false = false;

    private static readonly TMP_PREFIX: string = 'vault-secret-editor-';

    public static async changeContext(targetName: string): Promise<void> {
        await spawnChildProcess('safe', ['target', targetName], true);
    }

    public static async getAllKeys(key: string): Promise<object> {
        let result: any = await spawnChildProcess('safe', ['export', key]);

        if (result === '') {
            return {};
        } else {
            return JSON.parse(result);
        }
    }


    public static async writeChangesToTempFile(targetName: string, key: string, data: any|object ) {

        if (VaultService.openTempFile === false) {
            VaultService.openTempFile = await fs.mkdtemp(join(tmpdir(), VaultService.TMP_PREFIX + targetName + '-', ));
            await fse.writeJson(VaultService.openTempFile + '/data.json', {});
        }
        const tempFileName = VaultService.openTempFile + '/data.json';
        let fileContent: Object = await fse.readJson(tempFileName);
        fileContent[key] = data;
        await fse.writeJson(tempFileName, fileContent);
    }

    public static async flushData(targetName: string): Promise<void> {
        console.log('Flushing updates...');
        if (VaultService.openTempFile !== false) {
            await execChildProcess('safe import < ' + VaultService.openTempFile + '/data.json', true);
        } else {
            console.log('Nothing to update or create');
        }
    }

    public static async deleteKey(targetName: string, key: string): Promise<void> {
        await execChildProcess('safe delete --destroy --force --all ' + key, true);
    }

}
