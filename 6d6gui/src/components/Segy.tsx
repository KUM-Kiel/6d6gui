// Main Content for the use of 6D6Copy.

import { useValidatedState, numericCheck, ValidatedValue } from '../validation'
import TextInput from './TextInput'
import { Actions, fileObj } from '../App'
import React from 'react'
import { InfoJson } from '../../../electron-app/kum-6d6'
import { SegyData } from '../../../electron-app/main'

type SegyProps = {
  srcFile: fileObj
  actions: Actions,
  filename: ValidatedValue<string>
  destPath: string,
  setFilename: (value: string) => void
  startProcessing: (data: SegyData) => void,
  d6Info: InfoJson | null,
  shotfile: string,
}

// The view for the use of 6d6Copy.
export const Segy = ({ actions, destPath, d6Info, srcFile, startProcessing, shotfile, filename, setFilename }: SegyProps) => {

  const [traceDuration, setTraceDuration] = useValidatedState('', numericCheck(1, 100000))

  return (
    <div className="segy-main">
      <p>This utility converts a 6D6 formatted file to a SEG-Y file.</p>

      <button
        className='btn medium'
        onClick={actions.choose6d6File}
      >
        Choose .6d6 File
      </button>
      { }
      <button
        className='btn medium'
        onClick={actions.chooseShotfile}
      >
        Choose Shotfile
      </button>
      {srcFile.filepath !== '' && (
        <div>
          <p><b>6d6 file:</b></p>
          <p>{srcFile.filepath}</p>
        </div>
      )}
      {shotfile !== '' && (
        <div>
          <p><b>Shotfile:</b></p>
          <p>{shotfile}</p>
        </div>
      )}
      {d6Info !== null && (<div>
        <button
          className='btn medium'
          onClick={actions.chooseTargetDirectory}
        >
          Choose Output Location
        </button>
        {destPath !== '' && (
          <div>
            <p><b>Output direction:</b></p>
            <p>{destPath}</p>
          </div>
        )}
        <div className={`${srcFile.filepath === '' ? 'hidden' : 'shown'}`}>

        </div>
        <br />
        <TextInput
          value={filename.value}
          valid={filename.valid}
          changeFunction={setFilename}
          placeholder={'Filename'}
        />
        <br />
        <TextInput
          value={traceDuration.value}
          valid={traceDuration.valid}
          changeFunction={setTraceDuration}
          placeholder={'Duration of a Trace'}
        />
        {shotfile !== '' && d6Info !== null && <button
          type="submit"
          className="btn medium confirmation"
          onClick={() => {
            startProcessing({
              type: 'segy',
              filenameSegy: filename.value,
              traceDuration: +traceDuration.value,
              srcPath6d6: srcFile.filepath,
              srcPathShotfile: shotfile,
              targetLocation: destPath,
            })
          }}>
          Convert
        </button>}
      </div>)}
    </div >
  )
}

export default Segy
