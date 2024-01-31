import { MSeedData, ReadData, CopyData, SegyData } from '../../../electron-app/main'
import { Device } from '../../../electron-app/6d6watcher'
import { InfoJson } from '../../../electron-app/kum-6d6'
import { ValidatedValue } from '../validation'
import { Actions, fileObj } from '../App'
import MSeed from './MSeed'
import React from "react"
import Copy from './Copy'
import Read from './Read'
import Segy from './Segy'

// Defining the structure of the Content Props.
type ContentProps = {
  systemOS: string,
  contentId: number,
  setHighlightTime: (value: string) => void,
  actions: Actions,
  targetDirectory: string,
  fileChoice: string | null,
  setFilename: (value: string) => void,
  filename: ValidatedValue<string>,
  triggerConversion: (filename: MSeedData | ReadData | CopyData | SegyData) => void,
  d6Info: InfoJson | null,
  srcFile: fileObj,
  shotfile: string,
  extDevice: Device | null
}

// Container for the main content of a chosen MenuItem.
const Content = ({
  systemOS,
  contentId,
  setHighlightTime,
  actions,
  targetDirectory,
  fileChoice,
  setFilename,
  filename,
  triggerConversion,
  d6Info,
  srcFile,
  shotfile,
  extDevice
}: ContentProps) => {

  let contentShown
  // Passing the function call to App.js.
  const startProcessing = (data: MSeedData | ReadData | CopyData | SegyData): void => {
    triggerConversion(data)
  }

  // Change the content depending on the chosen MenuItem in the MenuRow.
  // Keep in mind that App.tsx defines when each of them is avaiable.
  if (contentId === 2) {
    contentShown = (
      <Read
        filename={filename}
        actions={actions}
        destPath={targetDirectory}
        d6Info={d6Info}
        srcFile={srcFile}
        setFilename={setFilename}
        startProcessing={startProcessing}
      />
    )
  } else if (contentId === 1) {
    contentShown = (
      <MSeed
        systemOS={systemOS}
        actions={actions}
        destPath={targetDirectory}
        d6Info={d6Info}
        srcFile={srcFile}
        setHighlightTime={setHighlightTime}
        startProcessing={startProcessing}
      />
    )
  } else if (contentId === 0) {
    contentShown = (
      <Segy
      filename={filename}
      actions={actions}
      destPath={targetDirectory}
      d6Info={d6Info}
      srcFile={srcFile}
      shotfile={shotfile}
      setFilename={setFilename}
      startProcessing={startProcessing}
      />
    )
  } else {
    contentShown = (
      <Copy
      filename={filename}
      actions={actions}
      destPath={targetDirectory}
        fileChoice={fileChoice}
        extDevice={extDevice}
        setFilename={setFilename}
        startProcessing={startProcessing}
      />
    )
  }
  return <div className='content-main'>{contentShown}</div>
}

export default Content
