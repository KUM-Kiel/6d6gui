import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { Combined6d6Header } from './6d6-header-validation'
import Watcher, { Device } from './6d6watcher'
import TaskManager from './spawnProcess'
import { execFile } from 'child_process'
import { stat } from 'fs/promises'
import Kum6D6 from './kum-6d6'
import path from 'path'
import util from 'util'
import fs from 'fs'

const execFileAsync = util.promisify(execFile)

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
  if (result.canceled || result.filePaths[0].length !== 1) return null
  if (directory) {
    return { path: result.filePaths[0] }
  } else {
    return { path: result.filePaths[0], srcFileDir: path.parse(result.filePaths[0]).dir, scrFileBase: path.parse(result.filePaths[0]).base }
  }
})

export interface d6InfoStructure {
  info: Combined6d6Header | null,
  channelNr: number,
  srcFile: string,
  srcFileBase: string,
  srcFileDir: string
}

ipcMain.handle('6d6info', async (event, path) => {
  if (process.platform === 'win32') {
    let r = await Kum6D6.open(path)

    if (r === null) return null

    return {...r.infoJson(), srcFile: path }
  } else {
    const command = binariesInstalled ? '6d6info' : './public/bin/6d6info'
    const r = await execFileAsync(command, ['--json', path])
    const result = JSON.parse(r.stdout)

    return { ...result, srcFile: path }
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

export interface ReadData {
  srcPath: string,
  srcFilename: string,
  targetDirectory: string,
  destFilename: string
}

// Handling the UI request for a 6d6Read command.
ipcMain.on('6d6read', async (event: any, data: ReadData) => {
  const from = path.join(data.srcPath, data.srcFilename)
  const to = path.join(data.targetDirectory, data.destFilename)
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
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  timeChoice: 'none'| 'both'| 'start'| 'end'
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
