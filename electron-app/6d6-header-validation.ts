import { Kum6d6Header, Channel } from './6d6-header'
import TaiDate from './tai'

export interface ClockError {
  time: TaiDate,
  deviation: number
}
export interface Position {
  latitude: string,
  longitude: string
}

// Interface naming convention adapted to
// JSON.parse(6d6info.stdout) output for convenience.
export interface Combined6d6Header {
  version: 1 | 2,
  startTime: TaiDate,
  endTime: TaiDate,
  sync: ClockError,        // first sync
  skew: ClockError | null, // second sync
  startAddressData: number,
  endAddressData: number,
  sampleRate: number,
  writtenSamples: bigint,
  lostSamples: number,
  bitDepth: number,
  recorderID: string,
  rtcID: string,
  positionOne: Position,
  positionTwo: Position,
  channels: Channel[],
  comment: string
}

export const combine6d6Headers = (headerOne: Kum6d6Header, headerTwo: Kum6d6Header): Combined6d6Header => {
  if (headerOne.version !== headerTwo.version)
    throw new Error('Mismatching versions.')
  if (headerOne.syncType !== 'sync')
    throw new Error('Invalid sync type.')
  if (headerTwo.syncType !== 'skew' && headerTwo.syncType !== null)
    throw new Error('Invalid skew type.')
  if (headerOne.syncTime === null)
    throw new Error('Invalid sync time.')

  let skew: ClockError | null = null
  if (headerTwo.syncType === 'skew' && headerTwo.syncTime !== null) {
    skew = {
      time: headerTwo.syncTime,
      deviation: headerTwo.skew
    }
  }

  if (headerOne.address > headerTwo.address)
    throw new Error('Address spaces invalid.')

  if (headerOne.sampleRate !== headerTwo.sampleRate)
    throw new Error('Mismatched sample rate.')

  if (headerOne.writtenSamples !== 0n) throw new Error('Number of written samples of first header is invalid.')

  if (headerOne.lostSamples !== 0)
    throw new Error('Number of lost samples at beginning of the recording is not null!')

  if (headerOne.bitDepth !== headerTwo.bitDepth)
    throw new Error('Mismatched bit depth.')

  if (headerOne.recorderID !== headerTwo.recorderID)
    throw new Error('Mismatched recorder ID.')

  if (headerOne.rtcID !== headerTwo.rtcID)
    throw new Error('Mismatched real time clock ID.')

  if (headerOne.channels.length !== headerTwo.channels.length)
    throw new Error('Mismatched channels.')

  for (let i = 0; i < headerOne.channels.length; ++i) {
    if (headerOne.channels[i].name !== headerTwo.channels[i].name || headerOne.channels[i].gain !== headerTwo.channels[i].gain)
      throw new Error('Mismatched channels.')
  }

  if (headerOne.comment !== headerTwo.comment)
    throw new Error('Mismatched comments.')

  return {
    version: headerOne.version,
    startTime: headerOne.time,
    endTime: headerTwo.time,
    sync: { time: headerOne.syncTime, deviation: headerOne.skew },
    skew,
    startAddressData: headerOne.address,
    endAddressData: headerTwo.address,
    sampleRate: headerOne.sampleRate,
    writtenSamples: headerTwo.writtenSamples,
    lostSamples: headerTwo.lostSamples,
    bitDepth: headerOne.bitDepth,
    recorderID: headerOne.recorderID,
    rtcID: headerOne.rtcID,
    positionOne: { latitude: headerOne.latitude, longitude: headerOne.latitude },
    positionTwo: { latitude: headerTwo.latitude, longitude: headerTwo.longitude },
    channels: headerOne.channels,
    comment: headerOne.comment
  }
}

export default combine6d6Headers
