import {Helpers} from "./Helpers";
import * as fs from "node:fs/promises";
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as console from "node:console";
const fse = require('fs-extra');

export default class VaultUtility {

    private static openTempFiles: string[] = []

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
        if(!VaultUtility.openTempFiles.includes(targetName)) {
            VaultUtility.openTempFiles[targetName] = await fs.mkdtemp(join(tmpdir(), VaultUtility.TMP_PREFIX+targetName+'-', ));
            await fs.writeFile(VaultUtility.openTempFiles[targetName]+'/data.json', '{}');
        }
        const tempFileName = VaultUtility.openTempFiles[targetName]+'/data.json';
        let fileContent: Object = fse.readJsonSync(tempFileName);
        fileContent[key] = data
        fse.writeJsonSync(tempFileName, fileContent);
    }

    public static async flushData(targetName: string): Promise<void> {
        if( typeof VaultUtility.openTempFiles[targetName]!== 'undefined') {
            await Helpers.execChildProcess('safe import < ' + VaultUtility.openTempFiles[targetName]+'/data.json', true);
        }
    }

    public static async deleteKey(targetName: string, key: string): Promise<void> {
        await Helpers.execChildProcess('safe delete --destroy --force --all ' + key, true);
    }

}