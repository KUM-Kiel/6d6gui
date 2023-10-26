// Button to start a process/command.
import { ValidatedValue } from "../validation"
import { srcFileObj } from "../App"
import React from "react"

type StartButtonProps = {
  startProcessing: Function,
  type: string,
  filename: ValidatedValue<string>, // ???
  destPath: string,
  srcFile: srcFileObj
}

const StartButton = ({
  startProcessing,
  type,
  filename,
  destPath,
  srcFile
}: StartButtonProps) => {
  let condition : string

  if (type === 'copy') {
    condition = destPath
  } else if (type === 'read') {
    condition = srcFile.path
  }  else {
    condition = srcFile.path
  }
  return (
    <div>
      {condition !== '' &&
        ((filename.valid && (
          <button
            className='btn medium'
            onClick={() => {
              startProcessing({ type: type })
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
