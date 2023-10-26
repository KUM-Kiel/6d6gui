import { MSeedData, ReadData, CopyData, SegyData } from '../../../electron-app/main'
import { ValidatedValue } from '../validation'
import { Actions, srcFileObj } from '../App'
import MSeed from './MSeed'
import React from "react"
import Copy from './Copy'
import Read from './Read'
import Segy from './Segy'
import { InfoJson } from '../../../electron-app/kum-6d6'

// Defining the structure of the Content Props.
type ContentProps = {
  contentId: number,
  setHighlightTime: Function,
  actions: Actions,
  targetDirectory: string,
  fileChoice: string | null,
  setFilename: (value: string) => void,
  filename: ValidatedValue<string>,
  triggerConversion: Function,
  d6Info: InfoJson | null,
  srcFile: srcFileObj,
  shotfile: string
}

// Conainer for the main content of a chosen MenuItem.
const Content = ({
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
  shotfile
}: ContentProps) => {

  let contentShown
  // Passing the function call to App.js.
  const startProcessing = (data: MSeedData | ReadData | CopyData | SegyData): void => {
    triggerConversion(data)
  }

  // Change the content depending on the chosen MenuItem in the MenuColumn.
  if (contentId === 1) {
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
  } else if (contentId === 0) {
    contentShown = (
      <MSeed
        setHighlightTime={setHighlightTime}
        actions={actions}
        destPath={targetDirectory}
        d6Info={d6Info}
        srcFile={srcFile}
        startProcessing={startProcessing}
      />
    )
  } else if (contentId === 2) {
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
        srcFile={srcFile}
        startProcessing={startProcessing}
      />
    )
  }
  return <div className='content-main'>{contentShown}</div>
}

export default Content
