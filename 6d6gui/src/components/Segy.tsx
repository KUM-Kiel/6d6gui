// Main Content for the use of 6D6Copy.

import { useValidatedState, numericCheck, ValidatedValue } from '../validation'
import StartButton from './StartButton'
import TextInput from './TextInput'
import { Actions, srcFileObj } from '../App'
import React from 'react'
import { InfoJson } from '../../../electron-app/kum-6d6'

type SegyProps = {
  actions: Actions,
  destPath: string,
  d6Info: InfoJson | null,
  srcFile: srcFileObj
  startProcessing: Function,
  shotfile: string
  filename: ValidatedValue<string>
  setFilename: Function
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
      {}
      <button
        className='btn medium'
        onClick={actions.chooseShotfile}
      >
        Choose Shotfile
      </button>
      {shotfile !== null && (
        <div>
        <p>Your Shotfile: {shotfile}</p>
        </div>
      )}
      {d6Info !== null && (<div>
        <button
          className='btn medium'
          onClick={actions.chooseTargetDirectory}
        >
          Choose Output Location
        </button>

        <div className={`${srcFile.path === '' ? 'hidden' : 'shown'}`}>

        </div>
        <TextInput
          value={filename.value}
          valid={filename.valid}
          changeFunction={setFilename}
          placeholder={'Filename'}
        />
        <TextInput
          value={traceDuration.value}
          valid={traceDuration.valid}
          changeFunction={setTraceDuration}
          placeholder={'Duration of a Trace'}
        />
        <StartButton
          filename={filename}
          type={'segy'}
          srcFile={srcFile}
/*           d6Info={d6Info}
 */          destPath={destPath}
          startProcessing={startProcessing}
        />

        <button
          type="submit"
          className="btn medium confirmation"
          onClick={() => {
            startProcessing({
              filename: filename,
              traceDuration: traceDuration,
            })
          }}>
          Convert
        </button>
      </div>)}
    </div >
  )
}

export default Segy
