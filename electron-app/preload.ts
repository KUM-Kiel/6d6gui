import { ipcRenderer, contextBridge } from 'electron'
import { InfoJson } from './kum-6d6'
import { Device } from './6d6watcher'


type eventCallback = (event: any, ...data: any[]) => void

contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (ev: string, cb: eventCallback) => {
    ipcRenderer.on(ev, (e: any, ...data: any[]) => {
      cb({
        reply: (...args: any[]) => e.reply(...args)
      }, ...data)
    })
  },
  send: (ev: string, ...data: any[]) => {
    ipcRenderer.send(ev, ...data)
  },
  invoke: (ev: string, ...data: any[]) => {
    return ipcRenderer.invoke(ev, ...data)
  },
  getDevices: (): Promise<Device[] | null > => ipcRenderer.invoke('getDevices') ,

  chooseFile: (name: string, extensions: string[]): Promise<string[] | null> => ipcRenderer.invoke('chooseFile', name, extensions, false),

  chooseDirectory: (name: string, extensions: string[]): Promise<string[] | null> => ipcRenderer.invoke('chooseDirectory', name, extensions, true),

  get6d6Info: (filename: string): Promise<InfoJson> => ipcRenderer.invoke('6d6info', filename)
})
