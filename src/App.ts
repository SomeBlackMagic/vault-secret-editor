
import {hideBin} from 'yargs/helpers';
import * as yargs from 'yargs';
import * as process from 'process';
import {Logic} from './Logic';


(async () => {

    const argv: any = yargs(hideBin(process.argv))
        .version('dev-dirty')
        .command('download [path]', 'download all changes(by key) to local fs', (yargs) => {
            return yargs
                .positional('path', {
                    describe: 'path to download',
                    type: 'string',
                });
        }, Logic.downloadSecrets.bind(this))
        .command('checkDiff [path]', 'display diff about local and remote changes', (yargs) => {
            return yargs
                .positional('path', {
                    describe: 'path to download',
                    type: 'string',
                });
        }, Logic.checkDiff.bind(this))
        .command('apply [path]', 'apply local changes to remote vault', (yargs) => {
            return yargs
                .positional('path', {
                    describe: 'path to download',
                    type: 'string',
                });
        }, Logic.applyChanges.bind(this))


        .option('verbose', {
            alias: 'v',
            type: 'boolean',
            description: 'Run with verbose logging'
        })
        .parse();
    // console.log(argv);


})();




