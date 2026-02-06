import * as directoryTree from 'directory-tree';
import * as process from 'process';
import * as console from 'console';
import {readJsonFile} from '../utils/file';

export async function getLocalChanges(filePath: string, argv: any) {
    let localChanges = {};

    const promises: Promise<void>[] = [];

    directoryTree(filePath + argv.path.toString(), {extensions: /\.json$/}, (item, PATH, stats) => {
        const secretPath = PATH.replace(filePath, '').replace('.json', '');

        const promise = readJsonFile(item.path)
            .then((data) => {
                localChanges[secretPath] = data;
            })
            .catch((error) => {
                console.error('Cannot read file:' + item.path);
                console.error(error);
                process.exit(0);
            });

        promises.push(promise);
    });

    await Promise.all(promises);
    return localChanges;
}
