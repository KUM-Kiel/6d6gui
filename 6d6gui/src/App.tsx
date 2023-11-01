import { CopyData, FileErrorData, MSeedData, ReadData, SegyData } from '../../electron-app/main'
import useValidatedState, { filenameCheck } from './validation'
import { Device } from '../../electron-app/6d6watcher'
import { Task } from '../../electron-app/spawnProcess'
import { InfoJson } from '../../electron-app/kum-6d6'
import React, { useState, useEffect } from 'react'
import TaskManager from './components/TaskManager'
import MenuColumn from './components/MenuColumn'
import { keepTheme } from './components/Themes'
import FileList from './components/FileList'
import Content from './components/Content'
import Header from './components/Header'
import D6Info from './components/D6Info'
import './App.css'

//const { ipcRenderer } = window.require('electron')

type eventCallback = (event: any, ...data: any[]) => void
declare global {
  interface Window {
    ipcRenderer: {
      on: (ev: string, cb: eventCallback) => void,
      send: (ev: string, ...data: any[]) => void,
      invoke: (ev: string, ...data: any[]) => Promise<any>,
      getDevices: () => Promise<Device[] | null>,
      chooseFile: (name: string, extensions: string[]) => Promise<string[] | null>,
      chooseDirectory: (name: string, extensions: string[]) => Promise<string[] | null>,
      get6d6Info: (filename: string) => Promise<{ info: InfoJson, filepath: string, base: string, ext: string, directoryPath: string }>,
      triggerConversion: (data: MSeedData | ReadData | CopyData | SegyData) => Promise<void>,
      taskAction: (id: string, action: string) => Promise<void>
    }
  }
}

export interface Actions {
  choose6d6File: () => Promise<void>,
  chooseShotfile: () => Promise<void>,
  chooseTargetDirectory: () => Promise<void>
}

export interface fileObj {
  filepath: string,
  file: string,
  ext: string,
}

export interface MenuElement {
  id: number,
  title: string,
  active: boolean
}

export default function App() {

  const [appDarkMode, setAppDarkMode] = useState<boolean>(true)
  const [showContent, setShowContent] = useState<number>(0)
  const [highlightTime, setHighlightTime] = useState<string>('none')

  const [directories, setDirectories] = useState<Device[]>([])
  const [extDevices, setExtDevices] = useState<Device | null>(null)
  const [taskList, setTaskList] = useState<Task[]>([])

  const [d6Info, set6d6Info] = useState<InfoJson | null>(null)
  const [srcFile, setSrcFile] = useState<fileObj>({ filepath: '', file: '', ext: ''})
  const [shotfile, setShotfile] = useState<string>('')
  const [filename, setFilename] = useValidatedState<string>('', filenameCheck(1, 100))
  const [fileChoice, setFileChoice] = useState<string | null>(null)
  const [targetDirectory, setTargetDirectory] = useState<string>('')

  const [menuList] = useState<MenuElement[]>([
    { id: 0, title: 'MSeed', active: true },
    { id: 1, title: 'Read', active: false },
    { id: 2, title: 'SEG-Y', active: false },
    { id: 3, title: 'Copy', active: false },
  ])

  // After picking a new file, the once manually chosen targetDirectory won't be automatically adapted to the directory pf the src file.
  let targetDirectoryFlag = false

  // Returns the drives/directories useable for 6d6copy.
  const getDeviceInfo = (selected: Device) => {
    if (d6Info === null) return null
    if (fileChoice === null && srcFile.filepath !== '') {
      return extDevices
    } else {
      for (let i = 0; i < directories.length; ++i) {
        if (directories[i].name === selected.name) {
          return directories[i]
        }
      }
    }
    return null
  }

  // Request the 6d6info for a given file, if a valid response arrives set the current info according to that.
  const get6d6Info = async (filepath: string) => {
    let res = await window.ipcRenderer.get6d6Info(filepath)
    if (res === null) return null
    setSrcFile({
      filepath: res.filepath,
      file: res.base,
      ext: res.ext,
    })
    setFileChoice(null)
    // Default setting
    if (targetDirectory === '' || !targetDirectoryFlag) setTargetDirectory(res.directoryPath)
    targetDirectoryFlag = true
    set6d6Info(res.info)
  }

  // Three functions for inter process communication
  // (Requesting information and handling the responses accordingly.)
  const chooseShotfile = async () => {
    let shotfiles = await window.ipcRenderer.chooseFile('Shotfile', ['send', 'dat'])
    if (shotfiles !== null && shotfiles.length === 1) setShotfile(shotfiles[0])
  }

  const choose6d6File = async () => {
    let d6File = await window.ipcRenderer.chooseFile('6d6file', ['6d6'])
    console.log(d6File)
    if (d6File === null) return
    await get6d6Info(d6File[0])
  }

  const chooseTargetDirectory = async () => {
    let targetDirectories = await window.ipcRenderer.chooseDirectory('targetDirectory', ['*'])
    if (targetDirectories !== null) setTargetDirectory(targetDirectories[0])
    targetDirectoryFlag = true
  }

  // Forwarding an action trigger to the backend. -- ?!
  const triggerAction = async (id: string, action: string) => {
    let actionTriggered = await window.ipcRenderer.taskAction(id, action)
    console.log(actionTriggered)
  }

  const triggerConversion = async (data: MSeedData | ReadData | CopyData | SegyData): Promise<void> => {
    let temp = await window.ipcRenderer.triggerConversion(data)
    // How about throwing a dialog-window to display the error?
    console.log(temp)
  }

  // Collection of handlers for incoming information from the backend.
  useEffect(() => {
    window.ipcRenderer.on('device-list', (e: Event, devices: Device[]) => {
      setDirectories(devices)
    })
    keepTheme()

    // Recieving task list updates & changing the TaskManager accordingly.
    window.ipcRenderer.on('tasks', (e: Event, data: Task[]) => {
      setTaskList(data)
    })
    // For already used filenames etc.
    window.ipcRenderer.on('file-error', (e: Event, data: FileErrorData) => {
      if (data.type === '6d6copy') {
        console.log(data)
      } else if (data.type === '6d6read') {
        console.log(data)
      } else if (data.type === '6d6mseed') {
        console.log('The process was cancled due to already existing files.')
      }
    })
    // Initialization.
    window.ipcRenderer.send('start-up')
  }, [])

  // Function to change the shown main content.
  const switchContent = (id: number) => {
    setFilename('')
    setShowContent(menuList.filter(item => item.id === id)[0].id)
    setMenuItemActive(id)
  }

  // Changes the state of the MenuItems to react to user inputs.
  const setMenuItemActive = (id: number) => {
    menuList.forEach(item => (item.active = item.id === id ? true : false))
  }

  // As soon as something changes regarding a 6d6 device or file, the information about the chosen entity gets updated.
  const triggerInfoChange = (filename: Device) => {
    setFileChoice(filename.name)
    setExtDevices(getDeviceInfo(filename))
  }

  // Main application - Style to be found in ./App.css
  return (
    <div className='app'>
      <Header title={'K.U.M. 6D6 Suite'} />
      <MenuColumn
        menu={menuList}
        directories={directories}
        changeContent={switchContent}
        setAppDarkMode={setAppDarkMode}
      />
      <div className='app-container'>
        <div className='app-content'>
          <FileList
            changeFile={triggerInfoChange}
            dirList={directories}
            fileChoice={fileChoice}
            switchContent={switchContent}
          />
          {d6Info !== null && (
            <D6Info
              highlightTime={highlightTime}
              d6Info={d6Info}
              fileChoice={fileChoice}
              srcFile={srcFile}
            />
          )}
          <Content
            contentId={showContent}
            setHighlightTime={setHighlightTime}
            actions={{
              choose6d6File,
              chooseShotfile,
              chooseTargetDirectory
            }}
            targetDirectory={targetDirectory}
            fileChoice={fileChoice}
            setFilename={setFilename}
            filename={filename}
            triggerConversion={triggerConversion}
            d6Info={d6Info}
            srcFile={srcFile}
            shotfile={shotfile}
          />
        </div>
        <TaskManager
          triggerAction={triggerAction}
          taskList={taskList}
          appDarkMode={appDarkMode}
        />
      </div>
    </div>
  )
}
