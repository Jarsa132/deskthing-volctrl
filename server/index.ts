import { DeskThing as DK } from 'deskthing-server';
import { ChildProcess, fork } from 'child_process';
import path from 'path';
import { SessionData } from '../shared/types';

const DeskThing = DK.getInstance();
export { DeskThing }

// Thanks https://stackoverflow.com/a/55256318
const objectsEqual = (o1: { [x: string]: any; }, o2: { [x: string]: any; }) => Object.keys(o1).length === Object.keys(o2).length && Object.keys(o1).every(p => o1[p] === o2[p]);
const arraysEqual = (a1: any[], a2: string | any[]) => a1.length === a2.length && a1.every((o, idx) => objectsEqual(o, a2[idx]));

let audioProcess: ChildProcess | null = null;
let lastAudioData: SessionData[] = [];
let refreshInterval: NodeJS.Timeout | null = null;

const start = async () => {
    audioProcess = fork(path.resolve(__dirname, 'audioProcessor.js'));

    audioProcess.on('exit', (code) => {
        DeskThing.sendLog(`Audio process exited with code ${code}`);
        audioProcess = null;
    });

    DeskThing.on('set', (request) => {
        if (request.request === 'volume') {
            if (!audioProcess) return;
            audioProcess.send({ type: 'setVolume', payload: { pid: request.payload.pid, volume: request.payload.volume } });
        }
    });

    DeskThing.on('get', (request) => {
        if (request.request === 'audio') {
            DeskThing.sendDataToClient({ type: 'audio', payload: lastAudioData });
        }

        if (request.request === 'icons') {
            if (!audioProcess) return;
            audioProcess.send({ type: 'getIcons', payload: request.payload });
        }
    });

    refreshInterval = setInterval(() => {
        if (!audioProcess) {
            audioProcess = fork(path.resolve(__dirname, 'audioProcessor.js'));
            return
        }
        audioProcess.send({ type: 'getAudioData' });
    }, 1000);

    while (!audioProcess) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    audioProcess.on('message', (message: { type: string, payload: any }) => {
        if (message.type === 'audioData') {
            const data = message.payload;

            // Compare data to avoid spamming the same data
            if (lastAudioData.length > 0 && arraysEqual(lastAudioData, data)) return;

            lastAudioData = data;
            DeskThing.sendDataToClient({ type: 'audio', payload: data });
        }

        if (message.type === 'icons') {
            DeskThing.sendDataToClient({ type: 'icons', payload: message.payload });
        }
    });
};

// Stop the child process when DeskThing stops to unload .node files so they can be deleted
const stop = async () => {
    DeskThing.sendLog('Stopping app');

    if (refreshInterval) {
        DeskThing.sendLog('Clearing interval');
        clearInterval(refreshInterval);
        refreshInterval = null;
    }

    if (audioProcess) {
        DeskThing.sendLog('Killing audio process');
        audioProcess.kill();
        audioProcess = null;
    }
}

DeskThing.on('stop', stop);
DeskThing.on('purge', stop);

DeskThing.on('start', start);
