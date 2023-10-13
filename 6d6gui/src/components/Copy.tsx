// Main Content for the use of 6D6Copy.
import { d6InfoStructure } from '../../../electron-app/main'
import StartButton from './StartButton'
import TextInput from './TextInput'
import { Actions } from '../App'
import React from "react"

type CopyProps = {
  fileChoice: string | null,
  actions: Actions, // ??
  filename: string,
  destPath: string,
  d6Info: d6InfoStructure,
  setFilename: string,
  startProcessing: Function,
}

// The view for the use of 6d6Copy.
export const Copy = ({
  fileChoice,
  actions, // fail
  filename,
  destPath,
  d6Info,
  setFilename,
  startProcessing,
}: CopyProps) => {
  return (
    <div className="copy-main">
      <p>
        This utility copies the content of a 6D6 formatted storage to a
        choosable destination directory.
      </p>
      {fileChoice !== null && (
        <p>
          <button
            className="btn medium"
            onClick={actions.chooseTargetDirectory()}
          >
            Choose Directory
          </button>
        </p>
      )}
      <div className={`${destPath === '' ? 'hidden' : 'shown'}`}>
        <p>
          Set up to copy from{' '}
          <span className="copy-text-hightlight">{fileChoice}</span> to
        </p><div className="row">
          {destPath !== '' && (
            <TextInput
              value={filename.value}
              valid={filename.valid}
              changeFunction={setFilename}
              placeholder={'Filename'}
            />
          )}
          <p>.6d6</p></div>
        <p>
          in <span className="copy-text-hightlight">{destPath}/</span>
        </p>
      </div>
      <StartButton
        filename={filename}
        destPath={destPath}
        type={'copy'}
        startProcessing={startProcessing}
        d6Info={d6Info}
      />
    </div>
  )
}

export default Copy
