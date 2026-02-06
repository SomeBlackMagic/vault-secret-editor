import * as path from 'node:path';
import * as fse from 'fs-extra';
import VaultNormalizer from '../services/VaultNormalizer';

export async function writeJsonFile(filePath: string, data: Object): Promise<any> {
    const dir = path.dirname(filePath);
    await fse.ensureDir(dir);

    return fse.writeJson(filePath, data, {
        replacer: VaultNormalizer.denormilize.bind(this),
        spaces: 4
    });
}

export async function readJsonFile(filePath: string): Promise<Object> {
    const result = await fse.readJson(filePath);
    return VaultNormalizer.normilize(result);
}
