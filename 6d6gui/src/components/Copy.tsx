// Main Content for the use of 6D6Copy.
import StartButton from './StartButton'
import TextInput from './TextInput'
import { Actions, srcFileObj } from '../App'
import React from "react"
import { ValidatedValue } from '../validation'

// Defining the structure of the Props for the Copy-page.
type CopyProps = {
  fileChoice: string | null,
  actions: Actions,
  filename: ValidatedValue<string>,
  destPath: string,
  srcFile: srcFileObj | null,
  setFilename: Function,
  startProcessing: Function,
}

// The view for the use of 6d6Copy.
export const Copy = ({
  fileChoice,
  actions, // fail
  filename,
  destPath,
  srcFile,
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
            onClick={actions.chooseTargetDirectory}
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
      {srcFile !== null && (
        <StartButton
          filename={filename}
          destPath={destPath}
          type={'copy'}
          startProcessing={startProcessing}
          srcFile={srcFile}
        />)}
    </div>
  )
}

export default Copy
