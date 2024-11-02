const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const buildsDir = path.join(__dirname, 'dist');

if (!fs.existsSync(buildsDir)) fs.mkdirSync(buildsDir);

if (!fs.existsSync(path.join(buildsDir, 'node_modules'))) fs.mkdirSync(path.join(buildsDir, 'node_modules'));

if (!fs.existsSync(path.join(buildsDir, 'node_modules/node-audio-volume-mixer'))) {
    fs.cpSync(
        path.join(__dirname, 'node_modules/node-audio-volume-mixer'),
        path.join(buildsDir, 'node_modules/node-audio-volume-mixer'),
        {recursive: true}
    );
}

// archive the build, delete content of build folder and move the archive to the build folder
const archive = archiver('zip', {zlib: {level: 9}});
const output = fs.createWriteStream(path.join(__dirname, 'volctrl.zip'));

output.on('close', () => {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');

    fs.rmSync(buildsDir, {recursive: true});
    if (!fs.existsSync(buildsDir)) fs.mkdirSync(buildsDir);

    fs.renameSync(path.join(__dirname, 'volctrl.zip'), path.join(buildsDir, 'volctrl.zip'));
});

archive.on('warning', (err) => {
    if (err.code === 'ENOENT') console.warn(err);
    else throw err;
});

archive.on('error', (err) => {
    throw err;
});

archive.pipe(output);
archive.directory(buildsDir, false);
archive.finalize();