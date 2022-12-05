#!/usr/bin/env node
import chalk from 'chalk';
import Cmd from "./command.js";
import os from "os";

process.chdir(os.homedir());
process.stdout.write(chalk.cyanBright(`${Cmd.shellPath}${chalk.redBright('( shell )> ')}`));

process.stdin.on('data', (userInput) => {
    if (Cmd.childProcess == "No") {
        userInput = userInput.toString().trim();
        Cmd.evaluateCmd(userInput);
    }
});

process.on('SIGINT', () => {
    if (Cmd.childProcess == "No") {
        process.stdout.write(`${chalk.yellowBright('^C')}\n${chalk.cyanBright(Cmd.shellPath)}${chalk.redBright('( shell )> ')}`);
    }
})