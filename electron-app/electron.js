const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const child_process = require('child_process')
const isDev = require('electron-is-dev')
const path = require('path')
const util = require('util')
const fs = require('fs')
const Watcher = require('./6d6watcher')
const TaskManager = require('./spawnProcess')
const execFile = util.promisify(child_process.execFile)

let mainWindow

// Creating an electron window with specified options.
function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 1000,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  const startURL = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`

  mainWindow.loadURL(startURL)

  // Toggles the menuBar & avaiability of the devtools.
  /* mainWindow.removeMenu() */
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.on('reload', () => {})
}
app.on('ready', createWindow)

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

const binariesInstalled = checkForBinaries()

// Broadcasting something across the whole application.
const broadcast = (ev, data) => {
  const windows = BrowserWindow.getAllWindows()
  for (let i = 0; i < windows.length; ++i) {
    windows[i].webContents.send(ev, data)
  }
}

// Sets up the watcher to broadcast the list of found devices.
const deviceList = Watcher(list => {
  broadcast('device-list', list)
})

// Initialization of the deviceList on startup of the application.
ipcMain.on('start-up', event => {
  event.reply('device-list', deviceList())
})

// Checks whether a file in a specific directory already exists.
const checkForFileExistence = path => {
  fs.stat(path, err => {
    if (err) {
      return false
    }
    return true
  })
}

// Opens up a system-dialogue to pick either a file or a directory.
const directoryChoiceDialogue = async (isFile, type) => {
  // Open file dialogue.
  if (isFile) {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        {
          name: '6d6 file',
          extensions: ['6d6']
        }
      ]
    })
    // If canceled or empty throw error.
    if (result.canceled || result.filePaths === []) {
      return {
        setup: 'directory-choice',
        error: true,
        errorMessage: new Error('No file chosen.')
      }
      // Successfully picked a file.
    } else {
      return {
        setup: 'directory-choice',
        error: false,
        filename: path.parse(result.filePaths[0]).base,
        dirPath: path.parse(result.filePaths[0]).dir,
        file: true,
        info: null
      }
    }
    // Open a folder/directory dialogue.
  } else {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    // If canceled or empty throw error.
    if (result.canceled || result.filePaths === []) {
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

// Handling the UI request to open up a file/path picking dialogue.
ipcMain.on('setup', async (event, data) => {
  try {
    let fileObject = await directoryChoiceDialogue(data.isFile, data.type)
    if (!fileObject.error) {
      try {
        const command = binariesInstalled ? '6d6info' : './public/bin/6d6info'
        const r = await execFile(command, [
          '--json',
          path.join(fileObject.dirPath, fileObject.filename)
        ])
        fileObject.info = JSON.parse(r.stdout)
        console.log(fileObject.info)
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

// Sets up the TaskManager to broadcast avaiable tasks.
const taskManager = new TaskManager(tasks => {
  broadcast('tasks', tasks)
})

// Handling the UI request for a 6d6Copy command.
ipcMain.on('6d6copy', (event, data) => {
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

// Handling the UI request for a 6d6Read command.
ipcMain.on('6d6read', (event, data) => {
  const from = path.join(data.srcPath, data.srcFilename)
  const to = path.join(data.srcPath, data.destFilename)
  if (!checkForFileExistence(to)) {
    taskManager.$6d6read(from, to, binariesInstalled)
  } else {
    event.reply('file-error', {
      type: '6d6read',
      message: 'The file already exists.'
    })
  }
})

// Handling the UI request for a 6d6MSeed command.
ipcMain.on('6d6mseed', (event, data) => {
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
ipcMain.on('task-action', (e, id, action) => {
  taskManager.action(id, action)
})
