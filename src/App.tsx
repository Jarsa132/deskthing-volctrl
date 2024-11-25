import React, { useEffect } from 'react'
import { DeskThing } from 'deskthing-client'
import { SocketData } from 'deskthing-client/dist/types'
import { SessionData } from '../shared/types'

const App: React.FC = () => {
    const deskthing = DeskThing.getInstance()

    const [processes, setProcesses] = React.useState<SessionData[]>([])
    const [icons, setIcons] = React.useState<{ [key: number]: string }>({})

    useEffect(() => {
        if (import.meta.env.MODE === 'development') {
            setProcesses([
                { name: 'Spotify', pid: 1, volume: 0.5, },
                { name: 'Discord', pid: 2, volume: 0.5, },
                { name: 'Chrome', pid: 3, volume: 0.5, },
                { name: 'Firefox', pid: 4, volume: 0.5, },
                { name: 'Edge', pid: 5, volume: 0.5, },
                { name: 'Brave', pid: 6, volume: 0.5, },
                { name: 'Opera', pid: 7, volume: 0.5, },
                { name: 'Vivaldi', pid: 8, volume: 0.5, },
                { name: 'Safari', pid: 9, volume: 0.5, },
                { name: 'Tor', pid: 10, volume: 0.5, },
                { name: 'Internet Explorer', pid: 11, volume: 0.5 },
            ])
        }
    }, [])

    useEffect(() => {
        let neededIcons: number[] = []

        // Look for icons that aren't loaded
        processes.forEach((process) => {
            if (!icons[process.pid]) {
                neededIcons.push(process.pid)
            }
        })

        if (neededIcons.length > 0) {
            deskthing.sendMessageToParent({ type: 'get', request: 'icons', payload: neededIcons })
        }

        // Remove unused icons to save memory
        for (const pid in icons) {
            if (!processes.some((process) => process.pid === parseInt(pid))) {
                delete icons[parseInt(pid)]
            }
        }
    }, [processes])

    useEffect(() => {
        const onAppData = async (data: SocketData) => {
            if (data.type === 'audio') {
                setProcesses(data.payload)
            }

            if (data.type === 'icons') {
                setIcons((prevIcons) => { return { ...prevIcons, ...data.payload } })
            }
        }

        deskthing.sendMessageToParent({ type: 'get', request: 'audio' })

        const removeListener = deskthing.on('volctrl', onAppData)

        return () => {
            removeListener()
        }
    }, [])

    function setVolume(pid: number, volume: number) {
        const newProcesses = processes.map((process) => {
            if (process.pid === pid) {
                return {
                    ...process,
                    volume: volume
                }
            }
            return process
        })

        setProcesses(newProcesses)

        deskthing.sendMessageToParent({ type: 'set', request: 'volume', payload: { pid, volume } })
    }

    return (
        <div className="bg-black w-screen h-screen flex flex-col gap-2 overflow-y-auto p-4">
            {processes.map((process) => {
                return (
                    <div key={process.pid} className="bg-white bg-opacity-10 w-full h-12 flex justify-items-center items-center shrink-0 m-auto gap-4 p-2 rounded-md">
                        <div className='w-[5%] h-full flex shrink-0 justify-items-center items-center'>
                            <div className='m-auto'>
                                {
                                 icons[process.pid] && <img src={`data:image/png;base64,${icons[process.pid]}`} />
                                }
                                
                            </div>
                        </div>
                        <h1 className="text-white w-1/3 shrink-0 text-center truncate">{process.name}</h1>


                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={process.volume}
                            onChange={(e) => setVolume(process.pid, parseFloat(e.target.value))}
                            className="w-[50%] shrink-0 slider"
                            style={{backgroundSize: `${Math.floor(process.volume *100)}% 100%`}}
                        />

                        <h2 className="text-white shrink-0 w-[5%] text-center">{Math.floor(process.volume *100)}%</h2>

                    </div>
                )
            })}
        </div>

    )
}

export default App
