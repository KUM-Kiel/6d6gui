import { MSeedData, ReadData, CopyData, d6InfoStructure } from '../../../electron-app/main'
import { Actions } from '../App'
import React from "react"
import Copy from './Copy'
import MSeed from './MSeed'
import Read from './Read'
import Segy from './Segy'

type ContentProps = {
  contentId: number,
  setHighlightTime: Function,
  actions: Actions,
  targetDirectory: string,
  fileChoice: string | null,
  setFilename: string,
  filename: string,
  triggerAction: Function,
  d6Info: d6InfoStructure | null,
  shotFile: string
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
  triggerAction,
  d6Info,
  shotFile
}: ContentProps) => {
  let contentShown

  // Passing the function call to App.js.
  const startProcessing = (data: MSeedData | ReadData | CopyData): void => {
    triggerAction(data)
  }

  // Change the content depending on the chosen MenuItem.
  if (contentId === 1) {
    contentShown = (
      <Read
        filename={filename}
        setFilename={setFilename}
        actions={actions}
        destPath={targetDirectory}
        d6Info={d6Info}
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
        startProcessing={startProcessing}
      />
    )
  } else if (contentId === 2) {
    contentShown = (
      <Segy
        actions={actions}
        destPath={targetDirectory}
        d6Info={d6Info}
        shotFile={shotFile}
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
        d6Info={d6Info}
        startProcessing={startProcessing}
      />
    )
  }
  return <div className='content-main'>{contentShown}</div>
}

export default Content
