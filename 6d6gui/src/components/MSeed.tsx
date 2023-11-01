import useValidatedState, { alphaNumericCheck } from '../validation'
import { InfoJson } from '../../../electron-app/kum-6d6'
import React, { ChangeEventHandler, useState } from 'react'
import TextInput from './TextInput'
import { Actions, fileObj } from '../App'
import { MSeedData } from '../../../electron-app/main'

type MSeedProps = {
  actions: Actions,
  destPath: string,
  d6Info: InfoJson | null,
  srcFile: fileObj,
  startProcessing: (data: MSeedData) => void,
  setHighlightTime: Function,
}
const standardTemplate = 'out/%S/%y-%m-%d-%C'

const pad = (n: number) => (n < 10 ? '0' : '') + n

// Validation for cut input.
const cutCheck = (maxChar: number) => {
  const regExp = new RegExp(`^[0-9]{` + 3 + ',' + maxChar + `}$`)
  return (input: string) => regExp.test(input) && parseInt(input) >= 300
}

// Validation for channels input.
const validateChannelsInput = (channelNr: number) => {
  const channelRegExp = '[A-Za-z0-9]{1,3}'
  const regExp = new RegExp(
    '^(' + channelRegExp + ',){' + (channelNr - 1) + '}' + channelRegExp + '$'
  )
  return (input: string) => input === '' || regExp.test(input)
}

const extractDateForInput = (header: InfoJson | null, version: string, time: boolean): string => {
  if (header === null) {
    return new Date().toISOString()
  } else {
    let temp
    if (version === 'start') {
      temp = new Date(header.start_time)
    } else {
      temp = new Date(header.end_time)
    }
    if (time) {
      return pad(temp.getUTCHours()) + ':' + pad(temp.getUTCMinutes()) + ':' + pad(temp.getUTCSeconds())
    } else {
      return (
        temp.getUTCFullYear() +
        '-' +
        pad(temp.getUTCMonth() + 1) +
        '-' +
        pad(temp.getUTCDate())
      )
    }
  }
}

const dropDownOptions = [
  { value: 'none', label: 'No time constraint' },
  { value: 'both', label: 'Start & End' },
  { value: 'start', label: 'Start' },
  { value: 'end', label: 'End' }
]

const outputTemplateList = [
  { id: 0, name: 'Year - %y', value: '%y' },
  { id: 1, name: 'Month - %m', value: '%m' },
  { id: 2, name: 'Day - %d', value: '%d' },
  { id: 3, name: 'Hour - %h', value: '%h' },
  { id: 4, name: 'Minute - %i', value: '%i' },
  { id: 5, name: 'Second - %s', value: '%s' },
  { id: 6, name: 'Station-Code - %S', value: '%S' },
  { id: 7, name: 'Location-Code - %L', value: '%L' },
  { id: 8, name: 'Channel - %C', value: '%C' },
  { id: 9, name: 'Network-Code - %N', value: '%N' },
  { id: 10, name: 'Julian Day - %j', value: '%j' },
]

// Main Content for the use of 6D6MSeed.
const MSeed = ({
  actions,
  destPath,
  d6Info,
  srcFile,
  startProcessing,
  setHighlightTime
}: MSeedProps) => {
  const [noDate, setNoDate] = useState<boolean>(false)
  const [noCut, setNoCut] = useState<boolean>(false)
  const [resample, setResample] = useState<boolean>(false)
  const [ignoreSkew, setIgnoreSkew] = useState<boolean>(false)
  const [timeChoice, setTimeChoice] = useState('none')
  const [cut, setCut] = useValidatedState('86400', cutCheck(7))
  const [station, setStation] = useValidatedState('', alphaNumericCheck(1, 5))
  const [network, setNetwork] = useValidatedState('', alphaNumericCheck(0, 2))
  const [location, setLocation] = useValidatedState('', alphaNumericCheck(0, 2))
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [channels, setChannels] = useValidatedState<string>('',
    validateChannelsInput(d6Info ? d6Info.channels.length : 0)
  )
  const [outputTemplate, setOutputTemplate] = useState({
    value: standardTemplate,
    valid: true
  })

  // Resetting the template.
  const setStandardTemplate = () => {
    setOutputTemplate({ value: standardTemplate, valid: true })
    document.getElementById('output-template')?.focus()
  }

  const setOutputTemplatePlusCheck = (value: string) => {
    let tempBool = /%S/g.test(value)
    setOutputTemplate({ value: value, valid: tempBool })
  }

  const resetAllInputs = () => {
    setStation('')
    setLocation('')
    setNetwork('')
    setChannels('')
  }

  const handleDropdownChange: ChangeEventHandler<HTMLSelectElement> = e => {
    setTimeChoice(e.target.value)
    setHighlightTime(e.target.value)
  }

  // Triggers according setter function of a useState.
  const handleCheckboxChange = (choice: number) => {
    if (choice === 1) {
      setResample(!resample)
    } else if (choice === 2) {
      setIgnoreSkew(!ignoreSkew)
    } else if (choice === 3) {
      setNoDate(!noDate)
    } else {
      setNoCut(!noCut)
    }
  }

  const minDate = extractDateForInput(d6Info, 'start', false)
  const maxDate = extractDateForInput(d6Info, 'end', false)

  const minTime = extractDateForInput(d6Info, 'start', true)
  const maxTime = extractDateForInput(d6Info, 'end', true)

  return (
    <div className='mseed-main'>
      <p>This utility converts a 6D6 formatted file to a MiniSEED file.</p>
      <button
        className='btn medium'
        onClick={actions.choose6d6File}
      >
        Choose File
      </button>
      {srcFile.filepath !== '' && (
        <button
          className='btn medium'
          onClick={actions.chooseTargetDirectory}
        >
          Choose Output Location
        </button>
      )}
      <br />
      <div className={`${srcFile.filepath === '' ? 'hidden' : 'shown'}`}>
        <p>
          Set up to convert from
          <span className='read-text-hightlight'> {srcFile.file} </span>
          to
        </p>
        <div className='input out-template-path'>
          <label className='grey'>Output Path</label>
          <input value={destPath + '/...'} disabled />
        </div>
        <br />
        With:
        <br />
        <div className='input out-template'>
          <label>Output Template</label>
          <input
            id='output-template'
            value={outputTemplate.value}
            onChange={e => {
              setOutputTemplatePlusCheck(e.target.value)
            }}
          />{' '}
          .mseed
        </div>
        <br />
        Add one of the following to the end of the output sample:
        <br />
        {outputTemplateList.map(template => (
          <button
            className='btn small'
            key={template.id}
            onClick={() => {
              setOutputTemplatePlusCheck(outputTemplate.value + template.value)
              document.getElementById('output-template')?.focus()
            }}
          >
            {template.name}
          </button>
        ))}
        <br />
        <div className='row'>
          <TextInput
            value={station.value}
            valid={station.valid}
            changeFunction={setStation}
            placeholder={'Station'}
          />
          <TextInput
            value={location.value}
            valid={location.valid}
            changeFunction={setLocation}
            placeholder={'Location'}
          />
        </div>
        <div className='row'>
          <TextInput
            value={network.value}
            valid={network.valid}
            changeFunction={setNetwork}
            placeholder={'Network'}
          />
          <TextInput
            value={channels.value}
            valid={channels.valid}
            changeFunction={setChannels}
            placeholder={'Channels'}
          />
          {!noCut && (
            <TextInput
              value={cut.value}
              valid={cut.valid}
              changeFunction={setCut}
              placeholder={'Cut Seconds'}
            />
          )}
        </div>
        {!(timeChoice === 'none') && (
          <div className='row' style={{ justifyContent: 'center' }}>
            {!(timeChoice === 'end') && (
              <div className='date-input'>
                <label>Start</label>
                <input
                  type='date'
                  value={startDate}
                  min={minDate}
                  max={maxDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ marginRight: '0.1em' }}
                  required
                ></input>
                <input
                  type='time'
                  value={startTime}
                  min={minTime}
                  max={maxTime}
                  onChange={e => setStartTime(e.target.value)} required
                ></input>
              </div>
            )}
            {!(timeChoice === 'start') && (
              <div className='date-input'>
                <label>End</label>
                <input
                  type='date'
                  value={endDate}
                  min={minDate}
                  max={maxDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ marginRight: '0.1em' }}
                  required
                ></input>
                <input
                  type='time'
                  value={endTime}
                  min={minTime}
                  max={maxTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                ></input>
              </div>
            )}
          </div>
        )}
        <div className='row center'>
          <div className='dropdown'>
            <label>
              Time constraints?
              <select value={timeChoice} onChange={handleDropdownChange}>
                {dropDownOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className='row center'>
          <label className='checkmark-container'>
            No Cut
            <input
              type='checkbox'
/*               label='no-cut'
 */              checked={noCut}
              onChange={() => {
                handleCheckboxChange(0)
              }}
            />
            <span className='checkmark'></span>
          </label>
          <label className='checkmark-container'>
            Resample
            <input
              type='checkbox'
/*               label='resample'
 */              checked={resample}
              onChange={() => {
                handleCheckboxChange(1)
              }}
            />
            <span className='checkmark'></span>
          </label>
          <label className='checkmark-container'>
            Ignore Skew
            <input
              type='checkbox'
/*               label='ignoreSkew'
 */              checked={ignoreSkew}
              onChange={() => {
                handleCheckboxChange(2)
              }}
            />
            <span className='checkmark'></span>
          </label>
        </div>
        <div className='row' style={{ justifyContent: 'center' }}>
          <button
            className='btn medium reset'
            onClick={() => setStandardTemplate()}
          >
            Reset Template
          </button>
          <button className='btn medium reset' onClick={() => resetAllInputs()}>
            Reset Inputs
          </button>
          <button
            className='btn medium reset'
            onClick={() => {
              setNoCut(true)
              setCut('86400')
              setNoCut(false)
            }}
          >
            Reset Cut
          </button>
        </div>
        <br />
        {timeChoice !== 'none' && (<div>
          {timeChoice === 'both' && ((startDate + startTime) > (endDate + endTime) && (<p>The <b>end</b> time has to be after the <b>start</b> time</p>))}
          {timeChoice === 'start' && ((minDate + minTime) > (startDate + startTime) && (<p>The start time has to be <b>after</b> the start of the recording.</p>))}
          {timeChoice === 'end' && ((endDate + endTime) > (maxDate + maxTime) && (<p>The end time has to be <b>before</b> the end of the recording.</p>))}
        </div>)}
        {station.valid &&
          location.valid &&
          network.valid &&
          channels.valid &&
          outputTemplate.valid &&
          (cut.valid || noCut) && (
            <button
              type="submit"
              className='btn medium confirmation'
              onClick={() => {
                startProcessing({
                  type: 'mseed',
                  srcFilepath: srcFile.filepath,
                  destPath: destPath,
                  station: station.value,
                  location: location.value,
                  network: network.value,
                  channels: channels.value,
                  template: outputTemplate.value + '.mseed',
                  logfile: true,
                  auxfile: true,
                  resample: resample,
                  ignoreSkew: ignoreSkew,
                  cut: noCut ? 0 : cut.value,
                  startDate: startDate,
                  startTime: startTime,
                  endDate: endDate,
                  endTime: endTime,
                  timeChoice: timeChoice
                })
              }}
            >
              Convert
            </button>
          )}
        <br />
        <div className='user-hint'>
          {!station.valid && (
            <p>
              The <b>station code</b> has to consist of 1 to 5 alphanumeric
              characters.
            </p>
          )}
          {!location.valid && (
            <p>
              The <b>location code</b> has to consist of 0 to 2 alphanumeric
              characters.
            </p>
          )}
          {!network.valid && (
            <p>
              The <b>network code</b> has to consist of 0 to 2 alphanumeric
              characters.
            </p>
          )}
          {!channels.valid && (
            <p>
              The <b>channel</b> names have to be separated by a comma.
            </p>
          )}
          {!outputTemplate.valid && (
            <p>
              The <b>output template</b> has to have a station-code.
            </p>
          )}
          {!cut.valid && !noCut && (
            <p>
              The <b>cut</b> parameter has to be at least 300.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default MSeed
