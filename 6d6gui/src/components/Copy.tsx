// Main Content for the use of 6D6Copy.
import TextInput from './TextInput'
import { Actions, fileObj } from '../App'
import React from "react"
import { ValidatedValue } from '../validation'
import { CopyData } from '../../../electron-app/main'

// Defining the structure of the Props for the Copy-page.
type CopyProps = {
  srcFile: fileObj | null,
  actions: Actions,
  filename: ValidatedValue<string>,
  destPath: string,
  setFilename: (value: string) => void,
  startProcessing: (data: CopyData) => void,
  fileChoice: string | null,
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
        <button
          type="submit"
          className="btn medium confirmation"
          onClick={() => {
            startProcessing({
              type: 'copy',
              srcPath: srcFile.filepath,
              targetDirectory: destPath,
              filenameCopy: filename.value,
            })
          }}></button>)}
    </div>
  )
}

export default Copy
