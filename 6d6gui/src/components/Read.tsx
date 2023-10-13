// Main Content for the use of 6D6Read.
import React from "react"

import TextInput from './TextInput'
import StartButton from './StartButton'

export const Read = ({
  d6Info,
  actions,
  startProcessing,
  filename,
  destPath,
  setFilename
}) => {

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
        {d6Info.srcFileDir !== '' && (
        <button
          className='btn medium'
          onClick={actions.chooseTargetDirectory}
        >
          Choose Output Location
        </button>
        )}
      </p>
      {d6Info.srcFileDir === '' && <p>Please choose a .6d6 file to convert from.</p>}
      <div className={`${d6Info.srcFileDir === '' ? 'hidden' : 'shown'}`}>
        <br />
        Set up to convert from
        <span className="read-text-hightlight"> {d6Info.srcFileBase} </span> to
        <div className="row">
          {d6Info.srcFileDir !== '' && (
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
        d6Info={d6Info}
        destPath={destPath}
        startProcessing={startProcessing}
      />
    </div>
  )
}

export default Read
