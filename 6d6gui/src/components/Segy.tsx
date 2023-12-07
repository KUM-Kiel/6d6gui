// Main Content for the use of 6D6Copy.

import { useValidatedState, numericCheck, ValidatedValue } from '../validation'
import { InfoJson } from '../../../electron-app/kum-6d6'
import { SegyData } from '../../../electron-app/main'
import { Actions, fileObj } from '../App'
import TextInput from './TextInput'
import React from 'react'

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

  const [traceDuration, setTraceDuration] = useValidatedState<string>('', numericCheck(1, 999))
  const [sourceDepth, setSourceDepth] = useValidatedState<string>('', numericCheck(0, 10000))

  return (
    <div className="segy-main">
      <p>This utility converts a 6D6 formatted file to a SEG-Y file.<br/>Please choose a 6d6-file <b>and</b> a shotfile!</p>

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
          <span className='read-text-hightlight'>{srcFile.filepath}</span>
        </div>
      )}
      {shotfile !== '' && (
        <div>
          <p><b>Shotfile:</b></p>
          <span className='read-text-hightlight'>{shotfile}</span>
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
            <span className='read-text-hightlight'>{destPath}</span>
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
          placeholder={'Duration of a Trace in Seconds'}
        />
        <br/>
        <p><b>Optional:</b></p>
        <TextInput
          value={sourceDepth.value}
          valid={sourceDepth.valid}
          changeFunction={setSourceDepth}
          placeholder={'Set Depth of the shot-source'}
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
      <div className='user-hint'>
        {!filename.valid && (
          <p>
            The <b>Filename</b> has to consist of alphanumeric characters.
          </p>
        )}
        {!traceDuration.valid && (
          <p>
            The <b>Duration</b> value has to be an integer greater than 0.
          </p>
        )}
      </div>
            </div>)}
    </div >
  )
}

export default Segy
