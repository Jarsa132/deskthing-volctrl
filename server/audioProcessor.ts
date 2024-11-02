import { NodeAudioVolumeMixer } from "node-audio-volume-mixer";
import find from 'find-process';
import getFileIcon from 'extract-file-icon';
import { SessionData } from '../shared/types';

let iconCache: { [key: string]: string } = {};

const getAudioData = async (): Promise<SessionData[]> => {
    const sessions = NodeAudioVolumeMixer.getAudioSessionProcesses();
    
    const promises = sessions.map(async (session) => {
        // Skip system sounds
        if (session.pid <= 0) return null;
        
        let sessionData: SessionData = {
            name: session.name.replace('.exe', ''),
            pid: session.pid,
            volume: NodeAudioVolumeMixer.getAudioSessionVolumeLevelScalar(session.pid),
            icon: undefined
        };

        if (iconCache[session.pid]) {
            sessionData.icon = iconCache[session.pid];
        } else {
            let process = await find('pid', session.pid).catch(() => null);
            //@ts-ignore
            if (process && process[0] && process[0].bin) {
                //@ts-ignore
                let icon = getFileIcon(process[0].bin, 32);
                sessionData.icon = icon.toString('base64');
                iconCache[session.pid] = sessionData.icon;
            }
        }
        
        return sessionData;
    });

    return (await Promise.all(promises)).filter(sessionData => sessionData !== null) as SessionData[];
};


process.on('message', async (message: string | { type: string, payload: any }) => {
    if (message === 'getAudioData') {
        const data = await getAudioData();
        if (process.send) {
            process.send({ type: 'audioData', payload: data });
        }
    } else if (typeof message === 'object' && 'type' in message && message.type === 'setVolume') {
        NodeAudioVolumeMixer.setAudioSessionVolumeLevelScalar(message.payload.pid, message.payload.volume);
    }
});
