const { ipcRenderer, contextBridge } = require('electron')

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
  }
})
