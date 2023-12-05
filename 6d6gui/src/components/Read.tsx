// Main Content for the use of 6D6Read.
import { ValidatedValue } from "../validation"
import TextInput from './TextInput'
import { Actions, fileObj } from "../App"
import React from "react"
import { InfoJson } from "../../../electron-app/kum-6d6"
import { ReadData } from "../../../electron-app/main"

type ReadProps = {
  srcFile: fileObj,
  actions: Actions,
  filename: ValidatedValue<string>,
  destPath: string,
  setFilename: (value: string) => void
  startProcessing: (data: ReadData) => void,
  d6Info: InfoJson | null,
}

export const Read = ({
  d6Info,
  srcFile,
  actions,
  startProcessing,
  filename,
  destPath,
  setFilename
}: ReadProps) => {

  return (
    <div className="read-main">
      <p>This utility converts a 6D6 formatted file to a .s2x file.</p>
      <p>
        <button
          className="btn medium"
          onClick={actions.choose6d6File}
        >
          Choose File
        </button>
        {d6Info !== null && (
          <button
            className='btn medium'
            onClick={actions.chooseTargetDirectory}
          >
            Choose Output Location
          </button>
        )}
      </p>
      {d6Info === null && <p>Please choose a .6d6 file to convert from.</p>}
      {d6Info !== null && (<div>
        <div className={`${d6Info !== null ? 'hidden' : 'shown'}`}>
          <br />
          Set up to convert from
          <span className="read-text-hightlight"> {srcFile.file} </span> to
          <div className="row">
            {srcFile.filepath !== '' && (
              <TextInput
                value={filename.value}
                valid={filename.valid}
                changeFunction={setFilename}
                placeholder={'Filename'}
              />
            )}
            <p>.s2x</p></div>
          <p>
            in <span className="read-text-hightlight">{destPath}</span>
          </p>
        </div>
        <br />
        <button
          type="submit"
          className="btn medium confirmation"
          onClick={() => {
            startProcessing({
              type: 'read',
              srcPath: srcFile.filepath,
              filenameRead: filename.value,
              targetDirectory: destPath
            })
          }}></button>
      </div>)}
    </div>
  )
}

export default Read
