import {exec, spawn} from 'child_process';

const debug = require('debug')('helpers');

export async function spawnChildProcess(command: string, args: string[], pipeLogs: boolean = false, logPrefix: string = ''): Promise<string> {
    debug('SpawnChildProcess: ' + command + ' ' + args.join(' '));
    return new Promise<any>((resolve, reject) => {

        const process = spawn(command, args.filter((item) => {
            return item !== '';
        }));
        let stdout: string = '';
        process.stderr.on('data', (arrayBuffer) => {
            const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
            data.forEach((item, index) => {
                if (item !== '' && item !== '\r') {
                    require('debug')('helpers:spawnChildProcess:' + (logPrefix === '' ? command : logPrefix) + ':stderr')(item.replace(/(?:\\[rn]|[\r\n]+)+/g, ''));
                }
            });

        });

        if (pipeLogs === true) {
            process.stdout.on('data', (arrayBuffer) => {
                const data = Buffer.from(arrayBuffer, 'utf-8').toString().split('\n');
                data.forEach((item, index) => {
                    if (item !== '') {
                        console.log(logPrefix + ' ' + item);
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

export async function execChildProcess(command: string, pipeLogs?: boolean, logPrefix?: string): Promise<string> {

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
