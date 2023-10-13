// Button to start a process/command.
import { d6InfoStructure } from "../../../electron-app/main"
import { ValidatedValue } from "../validation"
import React from "react"

type StartButtonProps = {
  startProcessing: Function,
  type: string,
  filename: ValidatedValue, // ???
  destPath: string,
  d6Info: d6InfoStructure
}

const StartButton = ({
  startProcessing,
  type,
  filename,
  destPath,
  d6Info
}: StartButtonProps) => {
  let condition : string

  if (type === 'copy') {
    condition = destPath
  } else if (type === 'read') {
    condition = d6Info.srcFileDir
  }  else {
    condition = d6Info.srcFileDir
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
