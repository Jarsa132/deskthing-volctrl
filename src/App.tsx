import React, { useEffect } from 'react'
import { DeskThing } from 'deskthing-client'
import { SocketData } from 'deskthing-client/dist/types'
import { SessionData } from '../shared/types'

import {Slider} from "@nextui-org/slider";
import { Image } from '@nextui-org/image';

const App: React.FC = () => {
    const deskthing = DeskThing.getInstance()

    const [processes, setProcesses] = React.useState<SessionData[]>([])
    const [icons, setIcons] = React.useState<{ [key: number]: string }>({})

    const [isMixerSelected , setIsMixerSelected] = React.useState(false)
    const [selectedProcess, setSelectedProcess] = React.useState<number | null>(null)
    const [isEnterHeld, setIsEnterHeld] = React.useState(false)


    useEffect(() => {

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopImmediatePropagation()
                e.preventDefault()
                setIsMixerSelected(!isMixerSelected)
                if (isMixerSelected) {
                    setSelectedProcess(null)
                }
            }

            if (e.key === 'Enter' && isMixerSelected) {
                e.stopImmediatePropagation()
                e.preventDefault()
                setIsEnterHeld(true)
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopImmediatePropagation()
                e.preventDefault()
            }

            if (e.key === 'Enter' && isMixerSelected) {
                e.stopImmediatePropagation()
                e.preventDefault()
                setIsEnterHeld(false)
            }
        }

        const scroll = (e: WheelEvent) => {
            if (!isMixerSelected) return
            e.stopImmediatePropagation()
            e.preventDefault()

            if(!isEnterHeld) {
                let isForward = e.deltaY < 0
                let processCount = processes.length
                if (isForward) {
                    if (selectedProcess === null) {
                        setSelectedProcess(0)
                    } else {
                        setSelectedProcess((selectedProcess + 1) % processCount)
                    }
                } else {
                    if (selectedProcess === null) {
                        setSelectedProcess(processCount - 1)
                    } else {
                        setSelectedProcess((selectedProcess - 1 + processCount) % processCount)
                    }
                }
            } else {
                if (selectedProcess === null) return

                let isForward = e.deltaY < 0
                let selectedProcessIndex = selectedProcess
                let selectedProcessVolume = processes[selectedProcessIndex].volume
                let newVolume = selectedProcessVolume

                if (isForward) {
                    newVolume = Math.min(selectedProcessVolume + 0.01, 1)
                } else {
                    newVolume = Math.max(selectedProcessVolume - 0.01, 0)
                }

                setVolume(processes[selectedProcessIndex].pid, newVolume)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        window.addEventListener('wheel', scroll)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            window.removeEventListener('wheel', scroll)
        }
    }, [isMixerSelected, setIsMixerSelected, selectedProcess, processes, isEnterHeld])

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
            {processes.map((process, index) => {
                return (
                    <div
                    key={process.pid}
                    className={`bg-white bg-opacity-10 w-full h-12 flex justify-items-center items-center shrink-0 m-auto gap-4 p-2 rounded-md ${selectedProcess == index && 'outline outline-green-500'}`}>
                        <div className='w-[5%] h-full flex shrink-0 justify-items-center items-center'>
                            <div className='m-auto'>
                                <Image src={`data:image/png;base64,${icons[process.pid] || ''}`} />
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
