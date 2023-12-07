import { MSeedData, ReadData, CopyData, SegyData } from '../../../electron-app/main'
import { ValidatedValue } from '../validation'
import { Actions, fileObj } from '../App'
import MSeed from './MSeed'
import React from "react"
import Copy from './Copy'
import Read from './Read'
import Segy from './Segy'
import { InfoJson } from '../../../electron-app/kum-6d6'
import { Device } from '../../../electron-app/6d6watcher'

// Defining the structure of the Content Props.
type ContentProps = {
  systemOS: string,
  contentId: number,
  setHighlightTime: Function,
  actions: Actions,
  targetDirectory: string,
  fileChoice: string | null,
  setFilename: (value: string) => void,
  filename: ValidatedValue<string>,
  triggerConversion: Function,
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
  if (contentId === 2) {
    contentShown = (
      <Read
        filename={filename}
        setFilename={setFilename}
        actions={actions}
        destPath={targetDirectory}
        d6Info={d6Info}
        srcFile={srcFile}
        startProcessing={startProcessing}
      />
    )
  } else if (contentId === 1) {
    contentShown = (
      <MSeed
        systemOS={systemOS}
        setHighlightTime={setHighlightTime}
        actions={actions}
        destPath={targetDirectory}
        d6Info={d6Info}
        srcFile={srcFile}
        startProcessing={startProcessing}
      />
    )
  } else if (contentId === 0) {
    contentShown = (
      <Segy
      actions={actions}
      destPath={targetDirectory}
      d6Info={d6Info}
      srcFile={srcFile}
      shotfile={shotfile}
      filename={filename}
      setFilename={setFilename}
      startProcessing={startProcessing}
      />
    )
  } else {
    contentShown = (
      <Copy
        fileChoice={fileChoice}
        filename={filename}
        setFilename={setFilename}
        actions={actions}
        destPath={targetDirectory}
        startProcessing={startProcessing}
        extDevice={extDevice}
      />
    )
  }
  return <div className='content-main'>{contentShown}</div>
}

export default Content
