import {Helpers} from './Helpers';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as console from 'node:console';
import * as fse from 'fs-extra';

export default class VaultUtility {

    private static openTempFile: string|false = false;

    private static readonly TMP_PREFIX: string = 'vault-secret-editor-';

    public static async changeContext(targetName: string): Promise<void> {
        await Helpers.spawnChildProcess('safe', ['target', targetName], true, 'safe');
    }

    public static async getAllKeys(key: string): Promise<object> {
        let result: any = await Helpers.spawnChildProcess('safe', ['export', key]);

        if (result === '') {
            return {};
        } else {
            return JSON.parse(result);
        }
    }


    public static async writeChangesToTempFile(targetName: string, key: string, data: any|object ) {

        if (VaultUtility.openTempFile === false) {
            VaultUtility.openTempFile = await fs.mkdtemp(join(tmpdir(), VaultUtility.TMP_PREFIX + targetName + '-', ));
            await fse.writeJson(VaultUtility.openTempFile + '/data.json', {});
        }
        const tempFileName = VaultUtility.openTempFile + '/data.json';
        let fileContent: Object = await fse.readJson(tempFileName);
        fileContent[key] = data;
        await fse.writeJson(tempFileName, fileContent);
    }

    public static async flushData(targetName: string): Promise<void> {
        console.log('Flushing updates...');
        if (VaultUtility.openTempFile !== false) {
            await Helpers.execChildProcess('safe import < ' + VaultUtility.openTempFile + '/data.json', true);
        } else {
            console.log('Nothing to update or create');
        }
    }

    public static async deleteKey(targetName: string, key: string): Promise<void> {
        await Helpers.execChildProcess('safe delete --destroy --force --all ' + key, true);
    }

}