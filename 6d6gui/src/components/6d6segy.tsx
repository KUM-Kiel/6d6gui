import { useValidatedState, numericCheck, numericCheckFloat, ValidatedValue } from '../validation'
import { InfoJson } from '../../../electron-app/kum-6d6'
import { SegyData } from '../../../electron-app/main'
import { Actions, fileObj } from '../app'
import TextInput from './text-input'
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

// The view for the use of 6d6Segy.
export const Segy = ({ actions, destPath, d6Info, srcFile, startProcessing, shotfile, filename, setFilename }: SegyProps) => {

  const [traceDuration, setTraceDuration] = useValidatedState<string>('', numericCheck(1, 999))
  const [lon, setLon] = useValidatedState<string>('', numericCheckFloat(-180, 180))
  const [lat, setLat] = useValidatedState<string>('', numericCheckFloat(-90, 90))

  // Combined conditions to enable the 'Convert' button.
  const canConvert = srcFile.file !== '' && shotfile !== '' && lon.valid && lat.valid && traceDuration.valid

  return (
    <div className="segy-main">
      <p>This utility converts a 6D6 formatted file to a SEG-Y file.<br />Please choose a 6d6-file <b>and</b> a shotfile!</p>

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
        <br />
        <div className="row">
          <TextInput
            value={lon.value}
            valid={lon.valid}
            changeFunction={setLon}
            placeholder={'Longitude in degrees'}
          />
          <TextInput
            value={lat.value}
            valid={lat.valid}
            changeFunction={setLat}
            placeholder={'Latitude in degrees'}
          />
        </div>
        <button
          disabled={!canConvert}
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
              lon: Number(lon.value),
              lat: Number(lat.value)
            })
          }}>
          Convert
        </button>
        <div className='user-hint'>
          {!filename.valid && (
            <p>
              The <b>Filename</b> has to consist of alphanumeric characters.
            </p>
          )}
          {!lon.valid && lat.valid && (
            <p>
              You need to enter the <b>coordinates</b> of the station.
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
