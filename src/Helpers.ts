const filendir = require('filendir');
const fse = require('fs-extra');
import {spawn, exec} from 'child_process';

export class Helpers {
    public static async spawnChildProcess(command: string, args: string[], pipeLogs?: boolean, logPrefix?: string): Promise<string> {
        return new Promise<any>((resolve, reject) => {
            const process = spawn(command, args.filter((item) => {
                return item !== '';
            }));
            let stdout: string = '';
            if (pipeLogs === true) {
                process.stdout.on('data', (arrayBuffer) => {
                    const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                    data.forEach((item, index) => {
                        if (item !== '') {
                            console.log(logPrefix + ' ' + item);
                        }
                    });

                });
                process.stderr.on('data', (arrayBuffer) => {
                    const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                    data.forEach((item, index) => {
                        if (item !== '') {
                            console.error(item);
                        }
                    });

                });
            } else {
                process.stdout.on('data', (arrayBuffer) => {
                    const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                    data.forEach((item, index) => {
                        if (item !== '') {
                            stdout += item;
                        }
                    });

                });
            }
            process.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
                if ((code === 0 || code === 1)) {
                    resolve(stdout);
                } else if (signal === 'SIGINT') {
                    resolve('{}');
                } else {
                    reject(new Error('command failed. Code: ' + code));
                }
            });

        });
    }
    public static async execChildProcess(command: string, pipeLogs?: boolean, logPrefix?: string): Promise<string> {
        return new Promise<any>((resolve, reject) => {
            const process = exec(command);
            let stdout: string = '';
            if (pipeLogs === true) {
                process.stdout.on('data', (arrayBuffer) => {
                    const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                    data.forEach((item, index) => {
                        if (item !== '') {
                            console.log(logPrefix + ' ' + item);
                        }
                    });

                });
                process.stderr.on('data', (arrayBuffer) => {
                    const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                    data.forEach((item, index) => {
                        if (item !== '') {
                            console.error(item);
                        }
                    });

                });
            } else {
                process.stdout.on('data', (arrayBuffer) => {
                    const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                    data.forEach((item, index) => {
                        if (item !== '') {
                            stdout += item;
                        }
                    });

                });
            }
            process.on('exit', (code: number | null, signal: NodeJS.Signals | null) => {
                if ((code === 0 || code === 1)) {
                    resolve(stdout);
                } else if (signal === 'SIGINT') {
                    resolve('{}');
                } else {
                    reject(new Error('command failed. Code: ' + code));
                }
            });

        });
    }


    public static async writeDataToFile(filePath, data) {
        return await filendir.writeFile(filePath, data);
    }

    public static readDataToFile(filePath): Object {
        let content: Object = fse.readJsonSync(filePath);
        for (const key in content) {
            if (content.hasOwnProperty(key)) {
                if (typeof content[key] === 'object' && content[key] !== null) {
                    content[key] = JSON.stringify(content[key]);
                }
            }
        }

        return content;
    }
}
