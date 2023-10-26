import { ipcRenderer, contextBridge } from 'electron'
import { Device } from './6d6watcher'
import { InfoJson } from './kum-6d6'
import { CopyData, MSeedData, ReadData, SegyData } from './main'


type eventCallback = (event: any, ...data: any[]) => void

contextBridge.exposeInMainWorld('ipcRenderer', {
  ...ipcRenderer,
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
  getDevices: (): Promise<Device[] | null> => ipcRenderer.invoke('getDevices'),

  chooseFile: (name: string, extensions: string[]): Promise<string[] | null> => ipcRenderer.invoke('chooseFile', name, extensions, false),

  chooseDirectory: (name: string, extensions: string[]): Promise<string[] | null> => ipcRenderer.invoke('chooseFile', name, extensions, true),

  get6d6Info: (filename: string): Promise<{ info: InfoJson, path: string, base: string, ext: string }> => ipcRenderer.invoke('6d6info', filename),

  triggerConversion: (data: MSeedData | ReadData | CopyData | SegyData): Promise<string> => {
    if (data.type === 'mseed') {
      ipcRenderer.invoke('6d6mseed', data)
    } else if (data.type === 'segy') {
      ipcRenderer.invoke('6d6segy', data)
    } else if (data.type === 'copy') {
      ipcRenderer.invoke('6d6copy', data)
    } else if (data.type === 'read') {
      ipcRenderer.invoke('6d6read', data)
    } else {
      return 'error'
    }
  },

  taskAction: (id: string, action: string): Promise<void> =>
    ipcRenderer.invoke('taskAction', id, action)
})
