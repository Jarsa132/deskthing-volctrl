import { NodeAudioVolumeMixer } from "node-audio-volume-mixer";
import getFileIcon from 'extract-file-icon';
import { SessionData } from '../shared/types';

import { findExecutables } from "./utils";

const getAudioData = async (): Promise<SessionData[]> => {
    const sessions = NodeAudioVolumeMixer.getAudioSessionProcesses();
    
    const promises = sessions.map(async (session) => {
        // Skip system sounds
        if (session.pid <= 0) return null;
        
        return {
            name: session.name.replace('.exe', ''),
            pid: session.pid,
            volume: NodeAudioVolumeMixer.getAudioSessionVolumeLevelScalar(session.pid),
        }
    });

    return (await Promise.all(promises)).filter(sessionData => sessionData !== null) as SessionData[];
};

const getIcon = async (bin: string): Promise<string> => {
    const icon = getFileIcon(bin, 32);
    if(!icon) return '';
    return icon.toString('base64');
};

const getIcons = async (pids: GetIconsPayload): Promise<{ [key: number]: string }> => {
    const executables = await findExecutables(pids);
    const icons = await Promise.all(executables.map(({ bin }) => getIcon(bin)));
    return executables.reduce((acc, { pid }, index) => {
        acc[pid] = icons[index];
        return acc;
    }, {});
}

type SetVolumePayload = { pid: number, volume: number };
type GetIconsPayload = number[];

process.on('message', async (message: { type: string, payload: SetVolumePayload | GetIconsPayload | any }) => {
    if(!process.send) return;

    if (message.type === 'getAudioData') {
        const data = await getAudioData();
        process.send({ type: 'audioData', payload: data });
    }

    if (message.type === 'setVolume') {
        NodeAudioVolumeMixer.setAudioSessionVolumeLevelScalar(message.payload.pid, message.payload.volume);
    }

    if(message.type === 'getIcons') {
        const icons = await getIcons(message.payload);
        process.send({ type: 'icons', payload: icons });
    }
});
