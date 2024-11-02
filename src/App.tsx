import React, { useEffect } from 'react'
import { DeskThing } from 'deskthing-client'
import { SocketData } from 'deskthing-client/dist/types'

import {Slider} from "@nextui-org/slider";

const App: React.FC = () => {
    const deskthing = DeskThing.getInstance()

    const [processes, setProcesses] = React.useState<{ name: string, pid: number, isMuted: boolean, volume: number }[]>([])

    useEffect(() => {
        const onAppData = async (data: SocketData) => {
            if (data.type === 'audio') {
                setProcesses(data.payload)
            }
        }

        deskthing.sendMessageToParent({ type: 'get', request: 'audio' })

        const removeListener = deskthing.on('volctrl', onAppData)

        return () => {
            removeListener()
        }
    })

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
        <div className="bg-slate-800 w-screen h-screen flex gap-2 overflow-y-auto p-4">
            {processes.map((process) => {
                return (
                    <div key={process.pid} className="bg-black w-48 h-full flex shrink-0 m-auto flex-col gap-2 p-2 rounded-md">
                        <h1 className="text-white text-center truncate">{process.name}</h1>
                        <h2 className="text-white text-center">{Math.floor(process.volume *100)}%</h2>


                        <Slider   
                            size="lg"
                            step={0.01}
                            maxValue={1}
                            minValue={0}
                            value={process.volume}
                            orientation="vertical"
                            aria-label="Volume"
                            defaultValue={process.volume}
                            onChange={(value) => {
                                setVolume(process.pid, Array.isArray(value) ? value[0] : value)
                            }}
                            onChangeEnd={(value) => {
                                setVolume(process.pid, Array.isArray(value) ? value[0] : value)
                            }}
                        />

                    </div>
                )
            })}
        </div>

    )
}

export default App
