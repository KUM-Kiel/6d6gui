import { useState, useEffect } from 'react'
import TaskManager from './components/TaskManager'
import FileList from './components/FileList'
import Content from './components/Content'
import Header from './components/Header'
import D6Info from './components/D6Info'
import Menu from './components/Menu'
import { useValidatedState, filenameCheck } from './validation'
import path from 'path'
import { keepTheme } from './components/Themes'
import './App.css'

//const { ipcRenderer } = window.require('electron')
const ipcRenderer = window.ipcRenderer

function App() {

  const [] = useState('')

  const [srcFile, setSrcFile] = useState({ path: '', filename: '' })
  const [appDarkMode, setAppDarkMode] = useState(true)
  const [directories, setDirectories] = useState([])
  /*   const [channelNr, setChannelNr] = useState(0) */
  const [showContent, setShowContent] = useState(0)
  const [extDevices, setExtDevices] = useState(null)
  /*   const [destPath, setDestPath] = useState('') */
  const [taskList, setTaskList] = useState([])
  const [filename, setFilename] = useValidatedState('', filenameCheck(1, 100))
  /*   const [shotfile, setShotfile] = useValidatedState('', filenameCheck(1, 100)) */
  const [fileChoice, setFileChoice] = useState(null)
  const [highlightTime, setHighlightTime] = useState('none')

  const [shotfile, setShotfile] = useState('')
  const [targetDirectory, setTargetDirectory] = useState('')
  const [d6File, set6d6File] = useState({ path: '', filenmae: '' })
  const [d6Info, set6d6Info] = useState({
    info: '',
    channelNr: 0,
    srcFileBase: '',
    srcFileDir: ''
  })
  // After picking a new file, the once manually chosen targetDirectory won't be automatically adapted to the directory pf the src file.
  let targetDirectoryFlag = false

  const [menuList] = useState([
    { id: 0, title: 'MSeed', active: true },
    { id: 1, title: 'Read', active: false },
    { id: 2, title: 'SEG-Y', active: false },
    { id: 3, title: 'Copy', active: false },
  ])

  // Returns the drives/directories useable for 6d6copy.
  const getDeviceInfo = selected => {
    if (fileChoice === null && srcFile.filename !== '') {
      return extDevices
    } else {
      for (let i = 0; i < directories.length; ++i) {
        if (directories[i].name === selected) {
          return directories[i]
        }
      }
    }
    return null
  }

  const get6d6Info = async (file) => {
    let fileInfo = await window.ipcRenderer.get6d6Info(file)
    if (fileInfo === null) return null
    setFileChoice(null)
    // Default setting
    if (targetDirectory === '' || !targetDirectoryFlag) setTargetDirectory(fileInfo.dirPath)
    set6d6Info({
      info: fileInfo.info,
      channelNr: fileInfo.channels.length,
      srcFileBase: fileInfo.filename,
      srcFileDir: fileInfo.dirPath,
    })
  }

  // Functions for inter process communication
  const chooseShotfile = async () => {
    let shotfiles = await window.ipcRenderer.chooseFile('Shotfile', ['send', 'dat'])
    if (shotfiles !== null && shotfiles.length === 1) setShotfile(shotfiles[0])
  }

  const choose6d6File = async () => {
    let d6Files = await window.ipcRenderer.chooseFile('6d6file', ['6d6'])
    if (d6Files !== null && d6Files.length === 1) set6d6File(path.parse(d6Files[0]).dir, path.parse(d6Files[0]).base)
    await get6d6Info(d6Files[0])
  }

  const chooseTargetDirectory = async () => {
    let targetDirectories = await window.ipcRenderer.chooseDirectory('targetDirectory')
    if (targetDirectories !== null && targetDirectories.length === 1) setTargetDirectory(targetDirectories[1])
    targetDirectoryFlag = true
  }
  // Collection of backend-msg handlers.
  useEffect(() => {
    ipcRenderer.on('device-list', (event, devices) => {
      setDirectories(devices)
    })
    keepTheme()
    /* ipcRenderer.on('setup', (event, data) => {
      if (data.error) {
        // Error-handling!
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
    }) */
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



  // Sending a request to run a certain Suite with avaiable arguments.
  const triggerSubmitCommand = data => {
    let deviceInfo = getDeviceInfo(fileChoice)
    if (data.type === 'copy') {
      if (deviceInfo !== null) {
        ipcRenderer.send('6d6copy', {
          source: deviceInfo.name,
          targetFilename: filename.value,
          targetDirectory
        })
      }
    } else if (data.type === 'read') {
      ipcRenderer.send('6d6read', {
        srcPath: srcFile.path,
        srcFilename: srcFile.filename,
        destPath: targetDirectory,
        destFilename: filename.value
      })
    } else if (data.type === 'mseed') {
      console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAHH:', data)
      ipcRenderer.send('6d6mseed', { ...data,
        srcPath: srcFile.path,
        srcFilename: srcFile.filename,

        /* station: data.station,
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
        timeChoice: data.timeChoice */
      })
    }
  }

  // Request to open up a dialogue to choose a path/file.

  const triggerInfoChange = filename => {
    setFileChoice(filename)
    setExtDevices(getDeviceInfo(filename))
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
          {extDevices !== null && (
            <D6Info
              highlightTime={highlightTime}
              deviceInfo={getDeviceInfo(fileChoice)}
              fileChoice={fileChoice}
              srcFile={srcFile.filename}
            />
          )}
          <Content
            setHighlightTime={setHighlightTime}
            deviceInfo={getDeviceInfo(fileChoice)}
            contentId={showContent}
            // choosePath={triggerPathDialogue}
            chooseShotfile={chooseShotfile}
            choose6d6File={choose6d6File}
            actions={{
              choose6d6File,
              chooseShotfile,
              chooseTargetDirectory
            }}
            destPath={targetDirectory}
            srcFile={srcFile}
            fileChoice={fileChoice}
            setFilename={setFilename}
            filename={filename}
            shotfile={shotfile}
            trSubmitCom={triggerSubmitCommand}
            channelNr={d6Info.channelNr}
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
