#!/usr/bin/env node
import fs from 'fs';
import chalk from 'chalk';
import os from 'os';
import { spawn, exec } from 'child_process';
import { getPermissionStatus, findSize, sizeFormater } from './supportFuc.js'


const Cmd = {
    shellPath: os.homedir(),
    done: async (output) => {
        if (output) {
            process.stdout.write(chalk.yellowBright(output) + "\n");
        }
        process.stdout.write(`${chalk.cyanBright(Cmd.shellPath)}${chalk.redBright('( shell )> ')}`);
    },
    childProcess: "No",
    backgroundProcess: {},
    evaluateCmd: (userInput) => {
        const userInputArray = userInput.split(" ");
        switch (userInputArray[0].toLowerCase()) {
            case "echo":
                Cmd.commandLibrary.echo(userInputArray.slice(1).join(" "));
                break;

            case "cd":
                if (userInputArray.slice(2) != '') {
                    Cmd.done(`Set-Location : A positional parameter cannot be found that accepts argument '${userInputArray.slice(2)}'`)
                    break;
                }
                else {
                    Cmd.commandLibrary.cd(userInputArray.slice(1));
                    break;
                }

            case "pwd":
                Cmd.done(process.cwd());
                break;

            case "ls":
                Cmd.commandLibrary.ls(userInputArray.slice(1));
                break;

            case "fg":
                Cmd.commandLibrary.fg(userInputArray.slice(1));
                break;

            case "exit":
                process.exit();

            default:
                Cmd.commandLibrary.binExecute(userInputArray);
        }
    },

    commandLibrary: {
        "echo": function (echoArgs) {
            Cmd.done(echoArgs);
        },
        "cd": function (cdArgs) {
            let args = cdArgs[0];
            try {
                if (args) {
                    switch (args) {
                        case "..":
                            process.chdir("..");
                            Cmd.shellPath = process.cwd();
                            Cmd.done(null);
                            break;
                        case "~":
                            process.chdir(os.homedir());
                            Cmd.shellPath = process.cwd();
                            Cmd.done(null);
                            break;
                        case "-":
                            process.chdir("..");
                            Cmd.shellPath = process.cwd();
                            Cmd.done(null);
                            break;
                        case "/":
                            process.chdir("\\");
                            Cmd.shellPath = process.cwd();
                            Cmd.done(null);
                            break;
                        default:
                            process.chdir(args);
                            Cmd.shellPath = process.cwd();
                            Cmd.done(null);
                    }
                }
                else {
                    Cmd.done(":~ Enter path!");
                }
            }
            catch (error) {
                Cmd.done(`:~ cd : Cannot find path '${process.cwd()}\\${args}' because it does not exist.`);
            }
        },
        "fg": function (fgArgs) {
            let args = fgArgs[0];

            try {
                let bg_ = Cmd.backgroundProcess;
                let bg = Object.keys(bg_);
                if (bg.length > 0) {
                    for (let i = 0; i < bg.length; i++) {
                        if (bg[i] == args) {
                            Cmd.childProcess = "Yes";
                            if (os.platform() === 'win32') {
                                // bg[i].stdout.resume();
                            } else {
                                bg[i].kill('SIGCONT');
                            }
                            console.log(`[${bg[i]}] resumed`);
                            break;
                        }
                    }
                }
            }
            catch (error) {
                console.log(error);
            }
        },
        "ls": function (lsArgs) {
            let args = lsArgs[0];
            try {
                if (!args) {
                    let data = fs.readdirSync(Cmd.shellPath);
                    let size = findSize(Cmd.shellPath, data);
                    process.stdout.write(chalk.yellowBright(`\ntotal ${size.length} \ntotal size: ${size.total} \n\n`));
                    for (let i = 0; i < data.length; i++) {
                        process.stdout.write(chalk.whiteBright(`${data[i]}\n`))
                    }
                    Cmd.done(null);
                }
                else if (args != '-l') {
                    let data = fs.readdirSync(Cmd.shellPath + '\\' + args);
                    let size = findSize(Cmd.shellPath + '\\' + args, data);
                    process.stdout.write(chalk.yellowBright(`\ntotal ${size.length} \ntotal size: ${size.total} \n\n`));
                    for (let i = 0; i < data.length; i++) {
                        process.stdout.write(chalk.whiteBright(`${data[i]}\n`));
                    }
                    Cmd.done(null);
                }
                else if (args == '-l') {
                    fs.readdir(Cmd.shellPath, (error, data) => {
                        if (error) throw error;
                        let size = findSize(Cmd.shellPath, data);
                        process.stdout.write(chalk.yellowBright(`\ntotal ${size.length} \ntotal size: ${size.total} \n\n`));
                        for (let i = 0; i < data.length; i++) {
                            let stats = fs.statSync(Cmd.shellPath + "//" + data[i]);
                            let modifyTime = stats.mtime.toUTCString().split(" ");
                            console.log(chalk.whiteBright(`${getPermissionStatus(stats)}  ${stats.nlink} ${os.userInfo().username} ${os.userInfo().username} ${sizeFormater(size, stats)} ${modifyTime[2]} ${modifyTime[1]} ${modifyTime[4]} ${data[i]} `));
                        }
                        Cmd.done(null);
                    }
                    )
                }
            }
            catch (error) {
                Cmd.done(chalk.yellowBright(':~ Enter correct flag! (-l or path)'));
            }
        },
        "binExecute": function (binArgs) {
            let argv = binArgs;
            let bg = Cmd.backgroundProcess;
            try {
                const node = spawn(argv[0], argv.slice(1, argv.length), { shell: true });

                Cmd.childProcess = "Yes";

                node.stdout.on('data', function (data) {
                    process.stdout.write(`${chalk.yellowBright(data.toString())}`);
                });

                node.stderr.on("error", function (error) {
                    console.log(":~Error!:" + error);
                })

                node.on('exit', function () {
                    if (os.platform() === 'win32') {
                        exec(`taskkill -F -T -PID ${node.pid}`);
                    } else {
                        node.kill(1);
                    }
                })

                node.stdin.on('pause', function () {
                    console.log(`[${pid()}] resumed`);
                })

                node.on('close', function () {
                    Cmd.childProcess = "No";
                    delete bg[node.pid];
                    Cmd.done(null);
                });

                function pid() {
                    return `[${Object.keys(bg)[Object.keys(bg).length - 1]}]`;
                }

                process.on('SIGINT', () => {
                    if (Cmd.childProcess == "Yes") {
                        node.kill('SIGINT');
                        delete bg[node.pid];
                        Cmd.childProcess = "No";
                        console.log(chalk.yellowBright("^C"));
                    }
                });

                process.stdin.on('data', (writeData) => {
                    if (writeData.toString('base64') == "Gg0K") {
                        bg[node.pid] = node;
                        if (os.platform() === 'win32') {
                            node.stdout.pause();
                            node.stdin.pause();
                        } else {
                            node.kill('SIGSTOP')
                        }
                        Cmd.childProcess = "No";
                        Cmd.done(null);
                    }
                    else {
                        node.stdin.write(writeData);
                    }
                });
            }

            catch (error) {
                Cmd.done(null);
            }
        }
    }
}

export default Cmd;