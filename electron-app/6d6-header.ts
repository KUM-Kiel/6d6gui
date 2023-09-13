import TaiDate from './tai'

export interface Channel {
  name: string,
  gain: number,
}

export interface Kum6d6Header {
  version: 1 | 2,
  time: TaiDate,
  syncType: null | 'sync' | 'skew',
  syncTime: TaiDate | null,
  skew: number,
  address: number,
  sampleRate: number,
  writtenSamples: bigint,
  lostSamples: number,
  bitDepth: number,
  recorderID: string,
  rtcID: string,
  latitude: string,
  longitude: string,
  channels: Channel[],
  comment: string,
}

export const malformedMessage = 'Malformed 6D6 Header'

// Helper Functions

// Byte-number to int-number with validation.
const bcdToInt = (b: number) => {
  let ones = (b & 15)
  let tens = ((b >> 4) & 15)

  if (ones > 9 || tens > 9) {
    throw new Error('Invalid BCD value.')
  }
  return (ones + tens * 10)
}

// Check for the offset to not exceed the value 512.
export const limit512 = (x: number) => {
  if (x > 512) throw new Error(malformedMessage)
  return x
}

// Reads a String of values until a 'zero' is found and returns the read string plus the accumulated offset.
const readStringZero = (block: DataView, o: number): [string, number] => {
  let a: number[] = []
  while (block.getUint8(o) !== 0) {
    a.push(block.getUint8(o))
    o = limit512(o + 1)
  }
  while (block.getUint8(o) === 0) {
    o = limit512(o + 1)
    if (o === 512) break
  }
  return [new TextDecoder().decode(new Uint8Array(a)), o]
}

// Checks for a block at a given offset whether a string matches the read value.
// Returns an increased offset.
export const memoryCompare = (block: DataView, o: number, value: string): number => {
  if (!str(block, o, value)) {
    throw new Error(malformedMessage)
  }
  o = limit512(o + 4)
  return o
}

// Checks whether a block at a given offset matches a string.
export const str = (block: DataView, offset: number, value: string): boolean => {
  for (let i = 0; i < value.length; ++i) {
    if (block.getUint8(offset + i) !== value.charCodeAt(i)) return false
  }
  return true
}

// Reads the value for a bcd-time an converts it properly.
export const readBcdTime = (block: DataView, offset: number): TaiDate | null => {
  try {
    let hour = bcdToInt(block.getUint8(offset))
    let minute = bcdToInt(block.getUint8(offset + 1))
    let second = bcdToInt(block.getUint8(offset + 2))
    let day = bcdToInt(block.getUint8(offset + 3))
    let month = bcdToInt(block.getUint8(offset + 4))
    let year = bcdToInt(block.getUint8(offset + 5)) + 2000

    if (hour > 23 || minute > 59 || second > 60 || day > 31 || day < 1 || month > 12 || month < 1) {
      return null
    }
    return new TaiDate(year, month, day, hour, minute, second)

  } catch (e) {
    return null
  }
}

// Reads and returns an entire .6d6 header.
export const kum6D6HeaderRead = (block: DataView): Kum6d6Header => {
  if (block.byteLength < 512) {
    throw new Error('Block too short.')
  }

  let o = 0
  let version: Kum6d6Header['version'] = 1
  if (str(block, o, '6D6\u0002')) {
    version = 2
    o = limit512(o + 4)
  }

  // Time
  o = memoryCompare(block, o, 'time')
  let time = readBcdTime(block, o)
  if (time === null) throw Error(malformedMessage)
  o = limit512(o + 6)

  // SyncType and Sync/Skew time
  let syncType: Kum6d6Header['syncType'] = null

  if (str(block, o, 'skew')) {
    syncType = 'skew'
  } else if (str(block, o, 'sync')) {
    syncType = 'sync'
  }
  o = limit512(o + 4)
  let syncTime = readBcdTime(block, o)
  o = limit512(o + 6)

  let skew: number
  if (syncType === null) {
    skew = 0
  } else {
    skew = block.getInt32(o, false)
  }
  o = limit512(o + 4)

  // Address (number of blocks from beginning of the file to the data).
  o = memoryCompare(block, o, 'addr')
  let address = block.getUint32(o)
  o = limit512(o + 4)

  // Sample Rate in samples/second.
  o = memoryCompare(block, o, 'rate')
  let sampleRate = block.getUint16(o)
  o = limit512(o + 2)

  // Number of written samples to the file.
  o = memoryCompare(block, o, 'writ')
  let writtenSamples: bigint
  writtenSamples = block.getBigUint64(o)
  o = limit512(o + 8)

  // Number of lost samples of the recording.
  o = memoryCompare(block, o, 'lost')
  let lostSamples = block.getUint32(o)
  o = limit512(o + 4)

  // Number of channels in this recording.
  o = memoryCompare(block, o, 'chan')
  let channelCount = block.getUint8(o)
  o = limit512(o + 1)

  // Amount of gain for each channel.
  o = memoryCompare(block, o, 'gain')
  let gains: number[] = []
  for (let i = 0; i < channelCount; ++i) {
    gains.push(block.getUint8(o) / 10)
    o = limit512(o + 1)
  }

  // Bit-depth of the recording.
  o = memoryCompare(block, o, 'bitd')
  let bitDepth = block.getUint8(o)
  o = limit512(o + 1)

  // Serial number of the datalogger.
  o = memoryCompare(block, o, 'rcid')
  let recorderID: string
  ;[recorderID, o] = readStringZero(block, o)

  // RTC serial number.
  o = memoryCompare(block, o, 'rtci')
  let rtcID: string
    ;[rtcID, o] = readStringZero(block, o)

  // Latitude at the syncTime in text form.
  o = memoryCompare(block, o, 'lati')
  let latitude: string
    ;[latitude, o] = readStringZero(block, o)

  // Longitude at the syncTime in text form.
  o = memoryCompare(block, o, 'logi')
  let longitude: string
    ;[longitude, o] = readStringZero(block, o)

  // The channel names - each channel has to have a name.
  let channels: Channel[] = []
  o = memoryCompare(block, o, 'alia')
  for (let i = 0; i < channelCount; ++i) {
    let name: string
      ;[name, o] = readStringZero(block, o)
    channels.push({ name, gain: gains[i] })
  }

  // Free-form text comment for the recording.
  o = memoryCompare(block, o, 'cmnt')
  let comment: string
    ;[comment, o] = readStringZero(block, o)

  if (o != 512) {
    throw new Error(malformedMessage)
  }

  time.year()
  syncTime?.year()

  return {
    version,
    time,
    syncType,
    syncTime,
    skew,
    address,
    sampleRate,
    writtenSamples,
    lostSamples,
    bitDepth,
    recorderID,
    rtcID,
    latitude,
    longitude,
    channels,
    comment,
  }
}

if (require.main === module) {
  let testHeader = new Uint8Array([116, 105, 109, 101, 18, 32, 57, 7, 7, 32, 115, 121, 110, 99, 9, 55, 83, 1, 7, 32, 0, 0, 0, 0, 97, 100, 100, 114, 0, 0, 0, 2, 114, 97, 116, 101, 0, 250, 119, 114, 105, 116, 0, 0, 0, 0, 0, 0, 0, 0, 108, 111, 115, 116, 0, 0, 0, 0, 99, 104, 97, 110, 4, 103, 97, 105, 110, 10, 10, 10, 10, 98, 105, 116, 100, 32, 114, 99, 105, 100, 54, 49, 54, 48, 55, 49, 51, 51, 0, 114, 116, 99, 105, 49, 56, 48, 50, 57, 57, 0, 108, 97, 116, 105, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 0, 108, 111, 103, 105, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 0, 97, 108, 105, 97, 72, 0, 88, 0, 89, 0, 90, 0, 99, 109, 110, 116, 66, 117, 110, 107, 101, 114, 32, 72, 89, 68, 32, 51, 49, 50, 49, 53, 53, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  console.log(kum6D6HeaderRead(new DataView(testHeader.buffer)))
}

export default kum6D6HeaderRead
