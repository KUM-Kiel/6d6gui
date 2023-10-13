import useValidatedState, { filenameCheck } from './validation'
import { FileErrorData, d6InfoStructure } from '../../electron-app/main'
import { Device } from '../../electron-app/6d6watcher'
import { Task } from '../../electron-app/spawnProcess'
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

const ipcRenderer: any = window['ipcRenderer']

export interface Actions {
  choose6d6File: () => Promise<void>,
  chooseShotfile: () => Promise<void>,
  chooseTargetDirectory: () => Promise<void>
}

export interface MenuElement {
  id: number,
  title: string,
  active: boolean
}

export default function App() {

  const [appDarkMode, setAppDarkMode] = useState<boolean>(true)
  const [directories, setDirectories] = useState<Device[]>([])

  const [showContent, setShowContent] = useState<number>(0)
  const [extDevices, setExtDevices] = useState<Device | null>(null)

  const [taskList, setTaskList] = useState<Task[]>([])
  const [filename, setFilename] = useValidatedState<string>('', filenameCheck(1, 100))

  const [fileChoice, setFileChoice] = useState<string | null>(null)
  const [highlightTime, setHighlightTime] = useState<string>('none')

  const [shotfile, setShotfile] = useState<string>('')
  const [targetDirectory, setTargetDirectory] = useState<string>('')
  const [d6Info, set6d6Info] = useState<d6InfoStructure | null>(null)
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
    if (fileChoice === null && d6Info.srcFileBase !== '') {
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

  const get6d6Info = async (file: string) => {
    let fileInfo = await ipcRenderer.get6d6Info(file)
    if (fileInfo === null) return null
    setFileChoice(null)
    // Default setting
    if (targetDirectory === '' || !targetDirectoryFlag) setTargetDirectory(fileInfo.dirPath)
    set6d6Info({
      info: fileInfo.info,
      channelNr: fileInfo.channels.length,
      srcFile: fileInfo.srcFile,
      srcFileBase: fileInfo.filename,
      srcFileDir: fileInfo.dirPath,
    })
  }

  // Three functions for inter process communication
  const chooseShotfile = async () => {
    let shotfiles = await ipcRenderer.chooseFile('Shotfile', ['send', 'dat'])
    if (shotfiles !== null && shotfiles.length === 1) setShotfile(shotfiles[0])
  }

  const choose6d6File = async () => {
    let d6File = await ipcRenderer.chooseFile('6d6file', ['6d6'])
    await get6d6Info(d6File.path)
  }

  const chooseTargetDirectory = async () => {
    let targetDirectories = await ipcRenderer.chooseDirectory('targetDirectory')
    if (targetDirectories !== null) setTargetDirectory(targetDirectories.path)
    targetDirectoryFlag = true
  }


  // Forwarding an action trigger to the backend.
  const triggerAction = async (id: number, action: string) => {
    let actionTriggered = await ipcRenderer.taskAction(id, action)
    console.log(actionTriggered)
  }

  // Collection of backend-msg handlers.
  useEffect(() => {
    ipcRenderer.on('device-list', (e: Event, devices: Device[]) => {
      setDirectories(devices)
    })
    keepTheme()

    // Recieving task list updates & changing the TaskManager accordingly.
    ipcRenderer.on('tasks', (e: Event, data: Task[]) => {
      setTaskList(data)
    })
    // For already used filenames etc.
    ipcRenderer.on('file-error', (e: Event, data: FileErrorData) => {
      if (data.type === '6d6copy') {
      } else if (data.type === '6d6read') {
      } else if (data.type === '6d6mseed') {
        console.log('The process was cancled due to already existing files.')
      }
    })
    // Initialization.
    ipcRenderer.send('start-up')
  }, [])

  // Function to change the shown main content.
  const switchContent = (id: number) => {
    setFilename({ value: '', valid: false })
    setShowContent(menuList.filter(item => item.id === id)[0].id)
    setMenuItemActive(id)
  }

  // Changes the state of the MenuItems to react to user inputs.
  const setMenuItemActive = (id: number) => {
    menuList.forEach(item => (item.active = item.id === id ? true : false))
  }

  // Request to open up a dialogue to choose a path/file.
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
              srcFile={d6Info.srcFile}
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
            triggerAction={triggerAction}
            d6Info={d6Info}
            shotFile={shotfile}
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
