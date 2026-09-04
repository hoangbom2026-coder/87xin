import Fs from 'fs';
import Path from 'path';
import { sync } from 'rimraf';
import fsExtra from 'fs-extra';
import { v4 as createUUID } from 'uuid';
// import getFolderSize from 'get-folder-size';

const basePath = Path.join(__dirname, '..', '..', 'public');

const checkAndNewPath = (str: string, index: number) => {
    const lastSlashIndex = str.lastIndexOf('\\');
    const fileName = str.substr(lastSlashIndex + 1);
    const filePath = str.substring(0, lastSlashIndex);

    const nameIndex = fileName.lastIndexOf('.');
    const extension = fileName.substr(nameIndex + 1);
    const name = str.substring(0, nameIndex);

    if (Fs.existsSync(`${filePath}`)) {
        return checkAndNewPath(str, index++);
    } else {
        return `${filePath}${name}(${index}).${extension}`;
    }
};

const checkFolderPath = (str: string, index: number) => {
    if (Fs.existsSync(`${str}(${index})`)) {
        return checkFolderPath(str, index + 1);
    } else {
        return { path: `${str}(${index})`, index };
    }
};

const createFolder = async (folderPath: string) => {
    try {
        let path = Path.join(basePath, folderPath);

        let folderName = folderPath.split('\\').pop();

        if (Fs.existsSync(path)) {
            const checkedName = await checkFolderPath(path, 1);
            path = checkedName.path;
            folderName = `${folderName}(${checkedName.index})`;
        }
        Fs.mkdirSync(path);
        const data = Fs.statSync(path);
        return { status: true, message: 'Success', data: { ...data, name: folderName } };
    } catch (err: any) {
        console.error(err);
        return { status: false, message: err.message };
    }
};

const rename = async (oldNamePath: string, newNamePath: string) => {
    try {
        const oldPath = Path.join(basePath, oldNamePath);
        let newPath = Path.join(basePath, newNamePath);

        if (Fs.existsSync(newPath)) {
            newPath = await checkAndNewPath(newPath, 1);
        }
        Fs.renameSync(oldPath, newPath);

        const extension = Path.extname(newPath);
        const fileData = Fs.statSync(newPath);
        const data = {
            name: Path.parse(newPath).base,
            extension,
            size: fileData.size,
            isFile: fileData.isFile(),
            birthtime: fileData.birthtime
        };
        return {
            status: true,
            data
        };
    } catch (err: any) {
        console.error(err);
        return { status: false, message: err.message };
    }
};

const removeFolder = (folderPath: string) => {
    try {
        const path = Path.join(basePath, folderPath);
        sync(path);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

const removeFile = async (filePath: string) => {
    try {
        const path = Path.join(basePath, filePath);
        Fs.unlinkSync(path);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

const moveFile = (filePath: string, newPath: string) => {
    try {
        const old = Path.join(basePath, filePath);
        const desc = Path.join(basePath, newPath);
        return fsExtra.moveSync(old, desc);
    } catch (err) {
        console.error(err);
        return false;
    }
};

const copyFile = async (folderName: string, fileName: string, newFileName?: string) => {
    const source = Path.join(basePath, folderName, fileName);
    let destinationFileName = '';

    if (newFileName) {
        destinationFileName = newFileName;
    } else {
        const ext = Path.extname(fileName);
        destinationFileName = `${createUUID()}${ext}`;
    }
    const destination = Path.join(basePath, folderName, destinationFileName);
    return await fsExtra
        .copy(source, destination)
        .then(() => {
            return { status: true, name: destinationFileName };
        })
        .catch(() => {
            return { status: false };
        });
};

function getFolderSize(folderPath: string) {
    const path = Path.join(basePath, folderPath);
    const fileNames = Fs.readdirSync(path);

    let totalSize = 0;

    fileNames.forEach((fileName) => {
        const filePath = Path.join(folderPath, fileName);
        const stats = Fs.statSync(filePath);

        if (stats.isFile()) {
            // If it's a file, add its size to the total
            totalSize += stats.size;
        } else if (stats.isDirectory()) {
            // If it's a directory, recursively call the function to get its size
            totalSize += getFolderSize(filePath);
        }
    });

    return totalSize;
}

export default {
    createFolder,
    removeFolder,
    removeFile,
    rename,
    moveFile,
    getFolderSize,
    copyFile
};
