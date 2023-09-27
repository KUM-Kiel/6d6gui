import path from 'path'
import fs from 'fs'
import util from 'util'
import { execFile } from 'child_process'
const execFileAsync = util.promisify(execFile)

import TaskManager, { Action } from './spawnProcess'
import Watcher, { Device } from './6d6watcher'
import Kum6D6, { InfoJson } from './kum-6d6'
import { stat } from 'fs/promises'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'

let mainWindow: any

// Creating an electron window with specified options.
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 1000,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  //old: mainWindow.loadURL(startURL)
  if (app.isPackaged) {
    mainWindow.loadFile('index.html'); // prod
  } else {
    mainWindow.loadURL('http://localhost:3000'); // dev
  }

  // Toggles the menuBar & avaiability of the devtools.
  /* mainWindow.removeMenu() */
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.on('reload', () => { })
}

//app.on('ready', createWindow)

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Checks for the existence of the 6d6compat on the local device.
const checkForBinaries = () => {
  // Worth a thought to deliver the binaries with the ui instead of checking for them on the system.
  //return child_process.execSync('6d6mseed') !== ''
  return fs.existsSync('/usr/local/bin/6d6info')
}

const binariesInstalled: boolean = checkForBinaries()

// Broadcasting something across the whole application.
const broadcast = (ev: string, data: Object) => {
  const windows = BrowserWindow.getAllWindows()
  for (let i = 0; i < windows.length; ++i) {
    windows[i].webContents.send(ev, data)
  }
}

// Sets up the watcher to broadcast the list of found devices.
const deviceList = Watcher((list: Device[]) => {
  broadcast('device-list', list)
})

// Initialization of the deviceList on startup of the application.
ipcMain.on('start-up', (event: any) => {
  event.reply('device-list', deviceList())
})

// Checks whether a file in a specific directory already exists.
const checkForFileExistence = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch (e) {
    return false
  }
}

/* const fileChoiceDialog = async (options: any): Promise<> => {
  return dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      options
    ]
  })
} */

ipcMain.handle('chooseFile', async (event, name, extensions, directory) => {
  let window = BrowserWindow.fromWebContents(event.sender)
  if (window === null) return null
  let result = await dialog.showOpenDialog(window, {
    properties: [directory ? 'openDirectory' : 'openFile'],
    filters: [
      {
        name, extensions
      }
    ]
  })
  if (result.canceled) return null
  return result.filePaths
})

ipcMain.handle('6d6info', async (event, path) => {
  if (process.platform === 'win32') {
    let r = await Kum6D6.open(path)
    console.log(r.header)
    if (r === null) return null
    return r.infoJson()
  } else {
    const command = binariesInstalled ? '6d6info' : './public/bin/6d6info'
    const r = await execFileAsync(command, ['--json', path])

    return JSON.parse(r.stdout)
  }
})

// Den ganzen Spaß nach App.js schicken lassen und dann nach unten propagieren
// + vorhandene Properties in einem sinnvollen Objekt zusammenfassen und dadurch struktur schaffen.

// Opens up a system-dialogue to pick either a file or a directory.
/* const directoryChoiceDialogue = async (isFile: boolean, type: 'source' | 'target' | 'shotfile'): Promise<void> => {
  // Open file dialogue.
  let result: Electron.OpenDialogReturnValue

   if (isFile) {
    if (type === 'shotfile') {
      result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
          {
            name: 'Shotfile',
            extensions: ['send', 'dat']
          }
        ]
      })
    } else {
      result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
          {
            name: '6d6 file',
            extensions: ['6d6']
          }
        ]
      })
    }
    // If canceled or empty throw error.
    if (result.canceled || result.filePaths.length === 0) {
      return {
        setup: 'directory-choice',
        error: true,
        errorMessage: new Error('No file chosen.')
      }
      // Successfully picked a file.
    } else {
      let p = path.parse(result.filePaths[0])
      return {
        setup: 'directory-choice',
        error: false,
        filename: p.base,
        dirPath: p.dir,
        file: true,
        info: 'mseed'
      }
    }
    // Open a folder/directory dialogue.
  } else {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    // If canceled or empty throw error.
    if (result.canceled || result.filePaths.length === 0) {
      return {
        setup: 'directory-choice',
        error: true,
        errorMessage: new Error('No directory chosen.')
      }
    } else {
      // Split responses by usecase.
      if (type === 'target') {
        return {
          setup: 'directory-choice',
          error: false,
          dirPath: result.filePaths[0],
          file: false,
          type: 'target'
        }
      } else {
        return {
          setup: 'directory-choice',
          error: false,
          dirPath: result.filePaths[0],
          file: false,
          type: 'source'
        }
      }
    }
  }
}
 */
interface IpcEvent {
  reply: (name: string, data: any) => void
}

// Handling the UI request to open up a file/path picking dialogue.
/* ipcMain.on('setup', async (event: IpcEvent, data: any) => {
  try {
    let fileObject: { setup: string, error: Error, filename: string, dirPath: string, file: boolean, info: string | InfoJson, type: string } = await directoryChoiceDialogue(data.isFile, data.type)
    if (!fileObject.error) {
      try {
        if (process.platform === 'win32') {
          let r = await Kum6D6.open(path.join(fileObject.dirPath, fileObject.filename))
          console.log(r.header)
          fileObject.info = r.infoJson()
        } else {
          const command = binariesInstalled ? '6d6info' : './public/bin/6d6info'
          const r = await execFile(command, [
            '--json',
            path.join(fileObject.dirPath, fileObject.filename)
          ])
          fileObject.info = JSON.parse(r.stdout)
        }
        fileObject.setup = 'directory-choice'
        fileObject.file = true
      } catch (e) {
        console.log('Choice dialogue error occurred: ', e)
        fileObject.info = 'No 6d6info avaiable.'
        fileObject.file = false
        fileObject.type = data.type
      }
    }
    console.log(fileObject)
    event.reply('setup', fileObject)
  } catch (e) {
    event.reply('setup', { error: e })
  }
})
 */


// Sets up the TaskManager to broadcast avaiable tasks.
const taskManager = new TaskManager(tasks => {
  broadcast('tasks', tasks)
})

interface CopyData {
  source: string,
  targetFilename: string,
  destPath: string
}

// Handling the UI request for a 6d6Copy command.
ipcMain.on('6d6copy', (event: any, data: CopyData) => {
  let tempPath = path.join(data.destPath, data.targetFilename)
  if (!checkForFileExistence(tempPath)) {
    taskManager.$6d6copy(
      data.source,
      data.destPath,
      data.targetFilename,
      binariesInstalled
    )
  } else {
    event.reply('file-error', {
      type: '6d6copy',
      message: 'The file already exists.'
    })
  }
})

interface ReadData {
  srcPath: string,
  srcFilename: string,
  destPath: string,
  destFilename: string
}

// Handling the UI request for a 6d6Read command.
ipcMain.on('6d6read', async (event: any, data: ReadData) => {
  const from = path.join(data.srcPath, data.srcFilename)
  const to = path.join(data.destPath, data.destFilename)
  if (!checkForFileExistence(to)) {
    taskManager.$6d6read(from, to, binariesInstalled)
  } else {
    event.reply('file-error', {
      type: '6d6read',
      message: 'The file already exists.'
    })
  }
})

export interface MSeedData {
  srcPath: string,
  srcFilename: string,
  destPath: string,
  station: string,
  location: string,
  network: string,
  channels: string[],
  template: string,
  logfile: boolean,
  auxfile: boolean,
  resample: boolean,
  ignoreSkew: boolean,
  cut: number,
  startDate: string,    // ??
  startTime: string,    // ??
  endDate: string,      // ??
  endTime: string,      // ??
  timeChoice: string    // ??

}

// Handling the UI request for a 6d6MSeed command.
ipcMain.on('6d6mseed', (event: any, data: MSeedData) => {
  console.log(data)
  let tempPath = path.join(data.srcPath, data.srcFilename)

  // the relevant path is build otherwise and can't be hardcoded!!!

  if (!checkForFileExistence(path.join(tempPath, 'out', data.station))) {
    taskManager.$6d6mseed(data, tempPath, binariesInstalled)
  } else {
    event.reply('file-error', {
      type: '6d6mseed',
      message: 'The station folder already exists.'
    })
  }
})

// Forwarding of a UI induced action on a task.
ipcMain.on('task-action', (e: Error, id: string, action: Action) => {
  taskManager.action(id, action)
})
