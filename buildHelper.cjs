const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const buildsDir = path.join(__dirname, 'dist');

console.log('\nCreating build...');

if (!fs.existsSync(buildsDir)) {
    console.log('Creating build directory...');
    fs.mkdirSync(buildsDir);
}

if (!fs.existsSync(path.join(buildsDir, 'node_modules'))) {
    console.log('Creating node_modules directory...');
    fs.mkdirSync(path.join(buildsDir, 'node_modules'));
}

if (!fs.existsSync(path.join(buildsDir, 'node_modules/node-audio-volume-mixer'))) {
    console.log('Copying node-audio-volume-mixer module...');
    fs.mkdirSync(path.join(buildsDir, 'node_modules/node-audio-volume-mixer'), { recursive: true });
    fs.readdirSync(path.join(__dirname, 'node_modules/node-audio-volume-mixer')).forEach(file => {
        const srcPath = path.join(__dirname, 'node_modules/node-audio-volume-mixer', file);
        const destPath = path.join(buildsDir, 'node_modules/node-audio-volume-mixer', file);
        if (fs.lstatSync(srcPath).isDirectory()) {
            fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// archive the build, delete content of build folder and move the archive to the build folder
const archive = archiver('zip', { zlib: { level: 9 } });
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