import { DeskThing as DK } from 'deskthing-server';
import { NodeAudioVolumeMixer}  from "node-audio-volume-mixer";
import find from 'find-process';
import getFileIcon from 'extract-file-icon';

const DeskThing = DK.getInstance();
export { DeskThing }

// Thanks https://stackoverflow.com/a/55256318
const objectsEqual = (o1, o2) => Object.keys(o1).length === Object.keys(o2).length && Object.keys(o1).every(p => o1[p] === o2[p]);
const arraysEqual = (a1, a2) => a1.length === a2.length && a1.every((o, idx) => objectsEqual(o, a2[idx]));

type SessionData = { name: string, pid: number, isMuted: boolean, volume: number, icon?: string };

const start = async () => {
    let lastAudioData: SessionData[] = []

    DeskThing.on('set', async (request) => {
        if (request.request === 'volume') {
            NodeAudioVolumeMixer.setAudioSessionVolumeLevelScalar(request.payload.pid, request.payload.volume)
        }
    })


    DeskThing.on('get', async (request) => {
        if (request.request === 'audio') {
          DeskThing.sendDataToClient({type: 'audio', payload: lastAudioData })
        }
    })

    setInterval(async () => {
      const sessions = NodeAudioVolumeMixer.getAudioSessionProcesses()

      let promises = sessions.map(async (session) => {

        // Skip system sounds
        if (session.pid <= 0) return null;
      
        let sessionData: SessionData = {
          name: session.name.replace('.exe', ''),
          pid: session.pid,
          isMuted: NodeAudioVolumeMixer.isAudioSessionMuted(session.pid),
          volume: NodeAudioVolumeMixer.getAudioSessionVolumeLevelScalar(session.pid),
          icon: undefined
        };
      
        let process = await find('pid', session.pid).catch(() => null);
        //@ts-ignore
        if (process && process[0] && process[0].bin) {
          //@ts-ignore
          let icon = getFileIcon(process[0].bin, 32);

          sessionData.icon = icon.toString('base64');
        }
      
        return sessionData;
      });
      
      let data = (await Promise.all(promises)).filter(sessionData => sessionData !== null);
      lastAudioData = data;

      // Compare data to avoid spaming the same data
      if (lastAudioData.length > 0 && arraysEqual(lastAudioData, data)) return

      DeskThing.sendDataToClient({type: 'audio', payload: data })


    }, 1000)

} 

DeskThing.on('start', start)