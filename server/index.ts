import { DeskThing as DK } from 'deskthing-server';
import { NodeAudioVolumeMixer}  from "node-audio-volume-mixer";
const DeskThing = DK.getInstance();
export { DeskThing }

// Thanks https://stackoverflow.com/a/55256318
const objectsEqual = (o1, o2) => Object.keys(o1).length === Object.keys(o2).length && Object.keys(o1).every(p => o1[p] === o2[p]);
const arraysEqual = (a1, a2) => a1.length === a2.length && a1.every((o, idx) => objectsEqual(o, a2[idx]));

const start = async () => {
    let lastAudioData: { name: string, pid: number, isMuted: boolean, volume: number }[] = []

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

    setInterval(() => {
      const sessions = NodeAudioVolumeMixer.getAudioSessionProcesses()
      
      let data: { name: string, pid: number, isMuted: boolean, volume: number }[] = []

      sessions.forEach((session) => {

        data.push({
          name: session.name.replace('.exe', ''),
          pid: session.pid,
          isMuted: NodeAudioVolumeMixer.isAudioSessionMuted(session.pid),
          volume: NodeAudioVolumeMixer.getAudioSessionVolumeLevelScalar(session.pid)
        })
      })

      // Remove system sounds
      data = data.filter(session => session.pid > 1)

      // Compare data to avoid spaming the same data
      console.log(lastAudioData, lastAudioData.length, data, arraysEqual(lastAudioData, data), lastAudioData.length > 0 && arraysEqual(lastAudioData, data))
      if (lastAudioData.length > 0 && arraysEqual(lastAudioData, data)) return

      DeskThing.sendDataToClient({type: 'audio', payload: data })

      lastAudioData = data

    }, 1000)

} 

DeskThing.on('start', start)