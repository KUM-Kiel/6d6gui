// Main Content for the use of 6D6Read.
import { ValidatedValue } from "../validation"
import StartButton from './StartButton'
import TextInput from './TextInput'
import { Actions, srcFileObj } from "../App"
import React from "react"
import { InfoJson } from "../../../electron-app/kum-6d6"

type ReadProps = {
  d6Info: InfoJson | null,
  srcFile: srcFileObj,
  actions: Actions,
  startProcessing: Function,
  filename: ValidatedValue<string>,
  destPath: string,
  setFilename: Function
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
      {d6Info !== null && <p>Please choose a .6d6 file to convert from.</p>}
      {d6Info !== null && (<div>
        <div className={`${d6Info !== null ? 'hidden' : 'shown'}`}>
          <br />
          Set up to convert from
          <span className="read-text-hightlight"> {srcFile.base} </span> to
          <div className="row">
            {srcFile.path !== '' && (
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
        <StartButton
          filename={filename}
          type={'read'}
          srcFile={srcFile}
        /*   d6Info={d6Info} */
          destPath={destPath}
          startProcessing={startProcessing}
        />
      </div>)}
    </div>
  )
}

export default Read
