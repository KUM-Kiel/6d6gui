// Showcase for the deviceList.
import { Device } from "../../../electron-app/6d6-watcher"
import React from "react"

// Defining the structure of the Props for the FileList-page.
type FileListProps = {
  dirList: Device[],
  changeFile: (filename: Device) => void,
  fileChoice: string | null,
  switchContent: (id: number) => void
}

// The FileList component with interactions for external devices formatted by a 6D6.
const FileList = ({ dirList, changeFile, fileChoice, switchContent }: FileListProps) => {
  return (
    <div>
      {dirList.length !== 0 && (
        <div className="list-style">
          {dirList.map((obj, key) =>
            <div style={{ marginTop: '0.5em' }} key={key}>
              <label style={{ marginLeft: '0.25em' }} >
                <input
                // was 'Left' at first, might not work due to case sensitivity
                  style={{ float: 'left' }}
                  type='radio'
                  onChange={() => {
                    // Switch to 'Copy' Menu, if file from filelist was chosen.
                    switchContent(3)
                    changeFile(obj)
                  }}
                  checked={obj.name === fileChoice}
                  value={obj.name}
                  name='file'
                  key={obj.info.recorder_id}
                />
                {obj.name}
              </label>
            </div>
          )}
        </div>
      )}
      {dirList.length === 0 && (
        <div className="list-style">Please connect a 6d6<br/>device to copy from.</div>
      )}
    </div>
  )
}

export default FileList
