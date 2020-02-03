#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = require("fs");
const PATH = require("path");
const os = require("os");
(function findConfigs(path, cb, configs = []) {
    fs.readdir(path, (err, files) => {
        if (err)
            return cb(err);
        Promise.all(files.map(file => {
            return new Promise((resolve, reject) => {
                if (file === 'node_modules')
                    return resolve();
                const p = PATH.join(path, file);
                fs.stat(p, (err, stats) => {
                    if (err)
                        return reject(err);
                    if (stats.isDirectory())
                        findConfigs(p, (err, c) => {
                            if (err)
                                return reject(err);
                            configs = [...configs, ...c];
                            resolve();
                        });
                    else if (stats.isFile()) {
                        if (file === 'tsconfig.json')
                            configs.push(p);
                        resolve();
                    }
                });
            });
        })).then(() => cb(null, configs)).catch(cb);
    });
})(process.cwd(), (err, configs) => {
    if (err)
        return console.log(err);
    let path = 'tsc';
    if (os.platform() === 'win32')
        path = PATH.join(PATH.parse(process.execPath).dir, 'tsc.cmd');
    for (let i = configs.length; i--;)
        tsc(path, PATH.parse(configs[i]).dir);
});
function tsc(path, cwd) {
    console.log(`Running Typescript compiler at ${cwd}`);
    const c = child_process_1.spawn(path, { cwd: cwd }).on('error', console.log);
    c.stderr.on('data', console.log).setEncoding('utf8');
    c.stdout.on('data', console.log).setEncoding('utf8');
}
