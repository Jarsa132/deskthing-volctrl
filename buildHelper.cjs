const fs = require('fs');
const path = require('path');

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