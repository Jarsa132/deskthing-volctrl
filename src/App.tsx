import React, { useEffect } from 'react'
import { DeskThing } from 'deskthing-client'
import { SocketData } from 'deskthing-client/dist/types'
import { SessionData } from '../shared/types'

import {Slider} from "@nextui-org/slider";
import { Image } from '@nextui-org/image';

const App: React.FC = () => {
    const deskthing = DeskThing.getInstance()

    const [processes, setProcesses] = React.useState<SessionData[]>([])

    useEffect(() => {
        if (import.meta.env.MODE === 'development') {
            setProcesses([
                { name: 'Spotify', pid: 1, isMuted: false, volume: 0.5, icon: '' },
                { name: 'Discord', pid: 2, isMuted: false, volume: 0.5, icon: '' },
                { name: 'Chrome', pid: 3, isMuted: false, volume: 0.5, icon: '' },
                { name: 'Firefox', pid: 4, isMuted: false, volume: 0.5, icon: '' },
                { name: 'Edge', pid: 5, isMuted: false, volume: 0.5, icon: '' },
                { name: 'Brave', pid: 6, isMuted: false, volume: 0.5, icon: '' },
                { name: 'Opera', pid: 7, isMuted: false, volume: 0.5, icon: '' },
                { name: 'Vivaldi', pid: 8, isMuted: false, volume: 0.5, icon: '' },
                { name: 'Safari', pid: 9, isMuted: false, volume: 0.5, icon: '' },
                { name: 'Tor', pid: 10, isMuted: false, volume: 0.5, icon: '' },
                { name: 'Internet Explorer', pid: 11, isMuted: false, volume: 0.5, icon: '' },
            ])
        }
    }, [])

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
                                <Image src={`data:image/png;base64,${process.icon}`} />
                            </div>
                        </div>
                        <h1 className="text-white w-1/3 shrink-0 text-center truncate">{process.name}</h1>


                        <Slider   
                            size="lg"
                            step={0.01}
                            maxValue={1}
                            minValue={0}
                            color='success'
                            value={process.volume}
                            aria-label="Volume"
                            defaultValue={process.volume}
                            onChange={(value) => {
                                setVolume(process.pid, Array.isArray(value) ? value[0] : value)
                            }}
                            onChangeEnd={(value) => {
                                setVolume(process.pid, Array.isArray(value) ? value[0] : value)
                            }}
                        />

                        <h2 className="text-white shrink-0 w-[5%] text-center">{Math.floor(process.volume *100)}%</h2>

                    </div>
                )
            })}
        </div>

    )
}

export default App
