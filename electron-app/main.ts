import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import Watcher, { Device } from './6d6watcher'
import TaskManager from './spawnProcess'
import { execFile } from 'child_process'
import { stat } from 'fs/promises'
import Kum6D6 from './kum-6d6'
import path from 'path'
import util from 'util'
import fs from 'fs'

const execFileAsync = util.promisify(execFile)
const systemOS = process.platform


export interface FileErrorData {
  type: string,
  message: string
}

let mainWindow: any

// Creating an electron window with specified options.
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 1000,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // old: mainWindow.loadURL(startURL)
  // TODO: fixup
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'frontend', 'index.html')); // prod
  } else {
    mainWindow.loadURL('http://localhost:3000'); // dev
    //mainWindow.loadFile(path.join(__dirname, 'frontend', 'index.html'));
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
  if (systemOS !== 'darwin') {
    app.quit()
  }
})

// Checks for the existence of the 6d6compat on the local device.
const checkForBinaries = () => {
  // for Linux: Worth a thought to deliver the binaries with the ui instead of checking for them on the system.
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
  event.reply('device-list', deviceList(), systemOS)
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
  if (result.canceled || result.filePaths.length !== 1) return null
  return result.filePaths
})

ipcMain.handle('6d6info', async (event, filepath: string) => {
  if (systemOS === 'win32') {
    let r = await Kum6D6.open(filepath)
    if (r === null) return null
    let info = { info: r.infoJson(), filepath: filepath, base: path.basename(filepath), ext: path.extname(filepath), directoryPath: path.dirname(filepath) }
    await r.close()
    return info
  } else {
    const command = binariesInstalled ? '6d6info' : './public/bin/6d6info'
    const r = await execFileAsync(command, ['--json', filepath])
    const result = JSON.parse(r.stdout)
    return { info: result, filepath: filepath, ext: path.extname(filepath), base: path.basename(filepath), directoryPath: path.dirname(filepath) }
  }
})

// Forwarding of a UI induced action on a task.
ipcMain.handle('taskAction', async (event, id, action) => {
  return taskManager.action(id, action)
})

// Sets up the TaskManager to broadcast avaiable tasks.
const taskManager = new TaskManager(tasks => {
  broadcast('tasks', tasks)
})

export interface CopyData {
  type: 'copy',
  srcPath: string,
  targetDirectory: string
  filenameCopy: string,
}

// Handling the UI request for a 6d6Copy command.
ipcMain.handle('6d6copy', (event: any, data: CopyData) => {
  let tempPath = path.join(data.targetDirectory, data.filenameCopy)
  if (!checkForFileExistence(tempPath)) {
    taskManager.$6d6copy(
      data.srcPath,
      data.targetDirectory,
      data.filenameCopy,
      binariesInstalled
    )
  } else {
    event.reply('file-error', {
      error: true,
      type: '6d6copy',
      message: 'The file already exists.'
    })
  }
})

export interface ReadData {
  type: 'read',
  srcPath: string,
  targetDirectory: string,
  filenameRead: string
}

// Handling the UI request for a 6d6Read command.
ipcMain.handle('6d6read', async (event: any, data: ReadData) => {
  const from = data.srcPath
  const to = path.join(data.targetDirectory, data.filenameRead)
  if (!checkForFileExistence(to)) {
    taskManager.$6d6read(from, to, binariesInstalled)
  } else {
    event.reply('file-error', {
      error: true,
      type: '6d6read',
      message: 'The file already exists.'
    })
  }
})

export interface MSeedData {
  type: 'mseed',
  srcFilepath: string,
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
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  timeChoice: 'none' | 'both' | 'start' | 'end'
}

// Handling the UI request for a 6d6MSeed command.
ipcMain.handle('6d6mseed', (event: any, data: MSeedData) => {
  if (!checkForFileExistence(path.join(data.srcFilepath, 'out', data.station))) {
    return {
      error: true,
      type: '6d6mseed',
      message: 'The station folder already exists.'
    }
  } else {
    taskManager.$6d6mseed(data, data.srcFilepath, binariesInstalled)
  }
})

export interface SegyData {
  type: 'segy',
  traceDuration: number,
  filenameSegy: string,
  srcPath6d6: string,
  srcPathShotfile: string,
  targetLocation: string,
}

ipcMain.handle('6d6segy', async (event: any, data: SegyData) => {
  /* console.log(data) */

  let tempPath = path.join(data.targetLocation, data.filenameSegy)

  console.log("Here's the tempPath: ", tempPath)
  console.log("Here's the fileExistence result22: ", await checkForFileExistence(tempPath))

  if (await checkForFileExistence(tempPath)) {
    return {
      error: true,
      type: '6d6segy',
      message: 'The SEG-Y files already exist.'
    }
  } else {
    taskManager.$6d6segy(data)
    return 'läuft!'
  }
})
