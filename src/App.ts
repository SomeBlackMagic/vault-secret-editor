
import {hideBin} from 'yargs/helpers';
import yargs from 'yargs';
import * as process from 'process';
import {downloadSecrets} from './commands/download';
import {checkDiff} from './commands/checkDiff';
import {applyChanges} from './commands/apply';


(async () => {

    const argv: any = yargs(hideBin(process.argv))
        .version('dev-dirty')
        .command(
            'download [instance] [path]',
            'download all changes(by key) to local fs',
            (yargs) => {
                return yargs
                    .positional('instance', {
                        describe: 'safe connection name',
                        type: 'string',
                        demandOption: true
                    })
                    .positional('path', {
                        describe: 'path in vault to download',
                        type: 'string',
                        demandOption: true
                    })

                    .option('clean-space', {
                        type: 'boolean',
                        alias: 'c',
                        describe: 'Remove local files before downloading',
                    })
                    .strict();
                },
            downloadSecrets
        )
        .command('checkDiff [instance] [path]', 'display diff about local and remote changes', (yargs) => {
            return yargs
                .positional('instance', {
                    describe: 'safe connection name',
                    type: 'string',
                    demandOption: true
                })
                .positional('path', {
                    describe: 'path in vault to download',
                    type: 'string',
                    demandOption: true
                });
        }, checkDiff)
        .command('apply [instance] [path]', 'apply local changes to remote vault', (yargs) => {
            return yargs
                .positional('instance', {
                    describe: 'safe connection name',
                    type: 'string',
                    demandOption: true
                })
                .positional('path', {
                    describe: 'path in vault to download',
                    type: 'string',
                    demandOption: true
                });
        }, applyChanges)


        .option('verbose', {
            alias: 'v',
            type: 'boolean',
            description: 'Run with verbose logging'
        })
        // .demandCommand(1, 'You need to specify a command')
        // .help()
        .parse();


})();
