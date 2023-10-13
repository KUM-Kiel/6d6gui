// Showcase for the deviceList.
import React from "react"
import { Device } from "../../../electron-app/6d6watcher"

type FileListProps = {
  dirList: Device[],
  changeFile: Function,
  fileChoice: string | null,
  switchContent: Function
}

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
                    switchContent(2)
                    changeFile(obj.name)
                  }}
                  checked={obj.name === fileChoice}
                  value={obj}
                  name='file'
                  key={obj.id}
                />
                {obj.name}
              </label>
            </div>
          )}
        </div>
      )}
      {dirList.length === 0 && (
        <div className="list-style">Please connect a 6d6<br />device to copy from.</div>
      )}
    </div>
  )
}

export default FileList
