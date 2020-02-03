#!/usr/bin/env node
import { spawn as child } from 'child_process';
import * as fs from 'fs';
import * as PATH from 'path';
import * as os from 'os';

(function findConfigs(path: string, cb: (err?: NodeJS.ErrnoException, configs?: string[]) => void, configs: string[] = []) {
    fs.readdir(path, (err, files) => {
        if (err) return cb(err);
        Promise.all(files.map(file => {
            return new Promise<string>((resolve, reject) => {
                if (file === 'node_modules') return resolve();
                const p = PATH.join(path, file);
                fs.stat(p, (err, stats) => {
                    if (err) return reject(err);
                    if (stats.isDirectory())
                        findConfigs(p, (err, c) => {
                            if (err) return reject(err);
                            configs = [...configs, ...c];
                            resolve();
                        })
                    else if (stats.isFile()) {
                        if (file === 'tsconfig.json') configs.push(p)
                        resolve()
                    }
                })
            })
        })).then(() => cb(null, configs)).catch(cb);
    });
})(process.cwd(), (err, configs) => {
    if (err) return console.log(err);

    let path = 'tsc';

    if (os.platform() === 'win32')
        path = PATH.join(PATH.parse(process.execPath).dir, 'tsc.cmd');

    for (let i = configs.length; i--;)
        tsc(path, PATH.parse(configs[i]).dir);
});

function tsc(path: string, cwd: string) {
    console.log(`Running Typescript compiler at ${cwd}`);

    const c = child(path, { cwd: cwd }).on('error', console.log);
    c.stderr.on('data', console.log).setEncoding('utf8');
    c.stdout.on('data', console.log).setEncoding('utf8');
}
