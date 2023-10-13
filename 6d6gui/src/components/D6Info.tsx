import { d6InfoStructure } from '../../../electron-app/main.js'
import D6RecorderChannels from './D6RecorderChannels.js'
import TaiDate from '../../../electron-app/tai.js'
import React from "react"

type D6InfoProps = {
  d6Info: d6InfoStructure,
  fileChoice: string | null,
  srcFile: string,
  highlightTime: string
}
// Showing the formatted 6D6Info between the deviceList & main content.
const D6Info = ({ d6Info, fileChoice, srcFile, highlightTime }: D6InfoProps) => {

  let startHighlight = false
  let endHighlight = false

  if (highlightTime === 'none') {
    startHighlight = false
    endHighlight = false
  } else {
    if (highlightTime === 'start') {
      startHighlight = true
      endHighlight = false
    } else if (highlightTime === 'end') {
      startHighlight = false
      endHighlight = true
    } else {
      startHighlight = true
      endHighlight = true
    }
  }

  const pad = (n: number) => (n < 10 ? '0' : '') + n
  const showFormattedDate = (date: TaiDate, type: string) => {
    let temp = new Date(date.toISOString())

    const prettyDate =
      temp.getUTCFullYear() +
      '-' +
      pad(temp.getUTCMonth() + 1) +
      '-' +
      pad(temp.getUTCDate())

    const prettyTime =
      pad(temp.getUTCHours()) +
      ':' +
      pad(temp.getUTCMinutes()) +
      ':' +
      pad(temp.getUTCSeconds())

    return (
      <div>
        <div className='thicker-font' >{type} time:</div>
        <div className='monospace'>
          {prettyDate + ' ' + prettyTime + ' UTC'}
        </div>
      </div>
    )
  }

  // Formatting the numbers to show relevant information.
  const significant = (n: number) => {
    if (n < 10) {
      return n.toFixed(2)
    } else if (n < 100) {
      return n.toFixed(1)
    } else {
      return n.toFixed(0)
    }
  }

  // Formatting the bytesize into a readable form.
  const showFormattedSize = (bytes: number) => {
    if (bytes < 1000) {
      return bytes + 'B'
    } else if (bytes < 1e6) {
      return significant(bytes / 1000) + ' kB'
    } else if (bytes < 1e9) {
      return significant(bytes / 1e6) + ' MB'
    } else if (bytes < 1e12) {
      return significant(bytes / 1e9) + ' GB'
    } else {
      return significant(bytes / 1e12) + ' TB'
    }
  }

  // If avaiable, showcases the comment in a readable manner.
  const showFormattedComment = (comment: string) => {
    let temp = ''
    if (comment !== undefined) {
      temp = comment.replace('\n', ', ')
    } else {
      temp = 'No comments avaiable.'
    }
    return (
      <div>
        <div className='thicker-font'>Comment:</div>
        <div className='monospace'>{temp}</div>
      </div>
    )
  }

  return (
    <div className='info-main'>
      {d6Info.info !== null ? (
        <div className='number-monospace'>
          <p>
            This is the 6d6Info for{' '}
            <span className='read-text-hightlight'>
              {' '}
              {fileChoice !== null ? fileChoice : srcFile}
            </span>
          </p>

          <div className='thicker-font'>Recorder Id:</div>
          <div className='monospace'>{d6Info.info.recorderID}</div>
          <div style={{ color: `${startHighlight ? 'var(--warning)' : ''}` }}>{showFormattedDate(d6Info.info.startTime, 'Start')}</div>
          <div style={{ color: `${endHighlight ? 'var(--warning)' : ''}` }}>{showFormattedDate(d6Info.info.endTime, 'End')}</div>
          {showFormattedDate(d6Info.info.sync.time, 'Sync')}
          <div className='thicker-font'>Sample rate:</div>
          <div className='monospace'>{d6Info.info.sampleRate}</div>
          <div className='thicker-font'>Size:</div>
          <div className='monospace'>{showFormattedSize(Number(d6Info.info.writtenSamples))}</div>
          <div className='thicker-font'>Channels:</div>
          <D6RecorderChannels channels={d6Info.info.channels} />
          {showFormattedComment(d6Info.info.comment)}
        </div>
      ) : (
        <p>Pick a 6D6 storage for further information.</p>
      )}
    </div>
  )
}

export default D6Info