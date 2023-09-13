import { useState, useEffect } from 'react'
import TaskManager from './components/TaskManager'
import FileList from './components/FileList'
import Content from './components/Content'
import Header from './components/Header'
import D6Info from './components/D6Info'
import Menu from './components/Menu'
import { useValidatedState, filenameCheck } from './validation'
import { keepTheme } from './components/Themes'
import './App.css'

//const { ipcRenderer } = window.require('electron')
const ipcRenderer = window.ipcRenderer

function App () {
  const [srcFile, setSrcFile] = useState({ path: '', filename: '' })
  const [appDarkMode, setAppDarkMode] = useState(true)
  const [directories, setDirectories] = useState([])
  const [channelNr, setChannelNr] = useState(0)
  const [showContent, setShowContent] = useState(0)
  const [fileInfo, setFileInfo] = useState(null)
  const [destPath, setDestPath] = useState('')
  const [taskList, setTaskList] = useState([])
  const [filename, setFilename] = useValidatedState('', filenameCheck(1, 100))
  const [fileChoice, setFileChoice] = useState(null)
  const [highlightTime, setHighlightTime] = useState('none')
  const [menuList] = useState([
    { id: 0, title: 'MSeed', active: true },
    { id: 1, title: 'Read', active: false },
    { id: 2, title: 'SEG-Y', active: false},
    { id: 3, title: 'Copy', active: false },
  ])

  // Returns the drives/directories useable for 6d6copy.
  const getDeviceInfo = selected => {
    if (fileChoice === null && srcFile.filename !== '') {
      return fileInfo
    } else {
      for (let i = 0; i < directories.length; ++i) {
        if (directories[i].name === selected) {
          return directories[i]
        }
      }
    }
    return null
  }

  // Function to change the shown main content.
  const switchContent = id => {
    setFilename('')
    setShowContent(menuList.filter(item => item.id === id)[0].id)
    setMenuItemActive(id)
  }
  // Changes the state of the MenuItems to react to user inputs.
  const setMenuItemActive = id => {
    menuList.forEach(item => (item.active = item.id === id ? true : false))
  }

  // Forwarding an action trigger to the backend.
  const triggerAction = (id, action) => {
    ipcRenderer.send('task-action', id, action)
  }

  // Collection of backend-msg handlers.
  useEffect(() => {
    ipcRenderer.on('device-list', (event, devices) => {
      setDirectories(devices)
    })
    keepTheme()
    ipcRenderer.on('setup', (event, data) => {
      if (data.error) {
      }
      if (data.setup === 'directory-choice') {
        if (data.error) {
          console.log('An Error occured!')
          console.log(data.errorMessage)
        } else {
          if (data.file) {
            setFileInfo(data.info)
            setChannelNr(data.info.channels.length)
            setSrcFile({ path: data.dirPath, filename: data.filename })
            setFileChoice(null)
            setDestPath(data.dirPath)
          } else {
            //  setFileInfo(getDeviceInfo(fileChoice))
            setDestPath(data.dirPath)
          }
        }
      }
    })
    // Recieving task list updates & changing the TaskManager accordingly.
    ipcRenderer.on('tasks', (event, data) => {
      setTaskList(data)
    })
    // Repsonse for trying to run an action.
    ipcRenderer.on('task-action', (event, data) => {
      console.log(data)
    })
    // For already used filenames etc.
    ipcRenderer.on('file-error', (event, data) => {
      if (data.type === '6d6copy') {
      } else if (data.type === '6d6read') {
      } else if (data.type === '6d6mseed') {
        console.log('The process was cancled due to already existing files.')
      }
    })
    // Initialization.
    ipcRenderer.send('start-up')
  }, [])

  // Sending a request to run a certain Suite with avaiable arguments.
  const triggerSubmitCommand = data => {
    let deviceInfo = getDeviceInfo(fileChoice)
    if (data.type === 'copy') {
      if (deviceInfo !== null) {
        ipcRenderer.send('6d6copy', {
          source: deviceInfo.name,
          targetFilename: filename.value,
          destPath
        })
      }
    } else if (data.type === 'read') {
      ipcRenderer.send('6d6read', {
        srcPath: srcFile.path,
        srcFilename: srcFile.filename,
        destPath: destPath, // TODO: Make destPath selectable!
        destFilename: filename.value
      })
    } else if (data.type === 'mseed') {
      console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAHH:', data)
      ipcRenderer.send('6d6mseed', {
        srcPath: srcFile.path,
        srcFilename: srcFile.filename,
        station: data.station,
        location: data.location,
        network: data.network,
        channels: data.channels,
        template: data.template,
        destPath: data.destPath,
        logfile: data.logfile,
        auxfile: data.auxfile,
        resample: data.resample,
        ignoreSkew: data.ignoreSkew,
        cut: data.cut,
        startDate: data.startDate,
        startTime: data.startTime,
        endDate: data.endDate,
        endTime: data.endTime,
        timeChoice: data.timeChoice
      })
    }
  }

  // Request to open up a dialogue to choose a path/file.
  const triggerPathDialogue = (file, type) => {
    if (file) {
      ipcRenderer.send('setup', { setup: 'directory-dialogue', isFile: true })
    } else {
      ipcRenderer.send('setup', {
        setup: 'directory-dialogue',
        isFile: false,
        type: type
      })
    }
  }

  const triggerInfoChange = filename => {
    setFileChoice(filename)
    setFileInfo(getDeviceInfo(filename))
  }

  // Main application - Style to be found in ./App.css
  return (
    <div className='app'>
      <Header title={'K.U.M. 6D6 Suite'} />
      <Menu
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
          {fileInfo !== null && (
            <D6Info
              highlightTime = {highlightTime}
              deviceInfo={getDeviceInfo(fileChoice)}
              fileChoice={fileChoice}
              srcFile={srcFile.filename}
            />
          )}
          <Content
            setHighlightTime = {setHighlightTime}
            deviceInfo={getDeviceInfo(fileChoice)}
            contentId={showContent}
            choosePath={triggerPathDialogue}
            destPath={destPath}
            srcFile={srcFile}
            fileChoice={fileChoice}
            setFilename={setFilename}
            filename={filename}
            trSubmitCom={triggerSubmitCommand}
            channelNr={channelNr}
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

export default App
