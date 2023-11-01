// Button to start a process/command.
import { ValidatedValue } from "../validation"
import { fileObj } from "../App"
import React from "react"
import { CopyData, ReadData, SegyData } from "../../../electron-app/main"
import { InfoJson } from "../../../electron-app/kum-6d6"

type StartButtonProps = {

  // anpassen, soll ich wirklich genau sein?:D
  type: string,
  filename: ValidatedValue<string>, // ???
  destPath: string,
  srcFile: fileObj,
  startProcessing: (data: ReadData | CopyData | SegyData) => void,
  shotfile?: string,
  d6Info?: InfoJson,
  fileChoice?: string,
}

const StartButton = ({
  type,
  filename,
  destPath,
  srcFile,
  startProcessing,
  shotfile,
  d6Info,
  fileChoice,

}: StartButtonProps) => {
  let condition : string

  if (type === 'copy') {
    condition = destPath
  } else if (type === 'read') {
    condition = srcFile.filepath
  }  else {
    condition = srcFile.filepath
  }
  return (
    <div>
      {condition !== '' &&
        ((filename.valid && (
          <button
            className='btn medium'
            onClick={() => {
              startProcessing({ type: type, targetDirectory: destPath,  filename, })
            }}
          >
            Start {type}
          </button>
        )) ||
          (!filename.valid &&
            ((filename.value === '' && <p>You need to enter a filename</p>) ||
              (filename.value !== '' && (
                <p style={{ color: 'var(--warning)' }}>
                  Invalid characters used.
                </p>
              )))))}
    </div>
  )
}
export default StartButton
