import fs from 'fs';

export function getPermissionStatus(stats) {
    let status = stats.isFile() ? "-" : "d";
    let others = [stats["mode"] & parseInt('004', 8) ? 'r' : '-', stats["mode"] & parseInt('002', 8) ? 'w' : '-', stats["mode"] & parseInt('001', 8) ? 'x' : '-'];
    let group = [stats["mode"] & parseInt('040', 8) ? 'r' : '-', stats["mode"] & parseInt('020', 8) ? 'w' : '-', stats["mode"] & parseInt('010', 8) ? 'x' : '-'];
    let owner = [stats["mode"] & parseInt('400', 8) ? 'r' : '-', stats["mode"] & parseInt('200', 8) ? 'w' : '-', stats["mode"] & parseInt('100', 8) ? 'x' : '-'];
    return status.concat(owner.join(""), group.join(""), others.join(""));
}

export function sizeFormater(size, stats) {
    return "".padEnd(String(size.max).length - String(stats.size).length) + stats.size;
}

export function findSize(path, data) {
    var arrayofFiles = [];
    var total = 0;
    for (let i = 0; i < data.length; i++) {
        let size = fs.statSync(path + "//" + data[i]).size;
        arrayofFiles.push(size);
        total += size;
    }
    return { length: data.length, total: total, max: Math.max(...arrayofFiles) }
}



