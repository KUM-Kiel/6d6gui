// Main Content for the use of 6D6Copy.

import { useValidatedState, numericCheck, filenameCheck } from '../validation'
import { d6InfoStructure } from '../../../electron-app/main'
import StartButton from './StartButton'
import TextInput from './TextInput'
import { Actions } from '../App'
import React from 'react'

type SegyProps = {
  actions: Actions,
  destPath: string,
  d6Info: d6InfoStructure | null,
  startProcessing: Function,
  shotFile: string
}

// The view for the use of 6d6Copy.
export const Segy = ({ actions, destPath, d6Info, startProcessing, shotFile }: SegyProps) => {


  const [filename, setFilename] = useValidatedState('', filenameCheck(1, 30))
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
      <button
        className='btn medium'
        onClick={actions.chooseShotfile}
      >
        Choose Shotfile
      </button>
      {d6Info.srcFileDir !== '' && (
        <button
          className='btn medium'
          onClick={actions.chooseTargetDirectory}
        >
          Choose Output Location
        </button>
      )}
      <div className={`${d6Info.srcFileDir === '' ? 'hidden' : 'shown'}`}></div>
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
        d6Info={d6Info}
        destPath={destPath}
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
    </div >
  )
}

export default Segy
