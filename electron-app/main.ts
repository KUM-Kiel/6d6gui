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

export interface FileErrorData {
  type: string,
  message: string
}

let mainWindow: any

console.log(fs.readFileSync(path.join(__dirname, 'preload.js'), 'utf-8'))

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


ipcMain.handle('6d6info', async (event, filepath) => {
  if (process.platform === 'win32') {
    let r = await Kum6D6.open(filepath)

    if (r === null) return null

    return {info: r.infoJson(),path: filepath, base: path.basename(filepath), ext: path.extname(filepath)}
  } else {
    const command = binariesInstalled ? '6d6info' : './public/bin/6d6info'
    const r = await execFileAsync(command, ['--json', filepath])
    const result = JSON.parse(r.stdout)

    return {info: result,path: filepath, ext: path.extname(filepath), base: path.basename(filepath)}
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
  type: string,
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
  type: string,
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
  type: string,
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

export interface SegyData {
  type: string,
  filenameSegy: string,
  srcPath6d6: string,
  srcPathShotfile: string,
  targetLocation: string,
}

ipcMain.on('6d6segy', (event: any, data: SegyData) => {

}
