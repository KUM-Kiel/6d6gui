import kum6D6HeaderRead, { memoryCompare } from './6d6-header'
import TaiDate from './tai'
import combine6D6Headers, { Combined6D6Header } from './6d6-header-validation'
import kum6D6MetaFrameRead, { MetaFrameCallbacks, parseMetaFrame } from './6d6-meta-data-converter'
import File from './file'

const isOdd = (n: number): boolean => {
  return (n % 2) === 1
}

interface ReadCallbacks extends MetaFrameCallbacks {
  onSamples?: (samples: Int32Array) => void | Promise<void>
}

const interpolate = (t0: bigint, t1: bigint, t: bigint, a0: number, a1: number): number => Number(t - t0) / Number(t1 - t0) * (a1 - a0) + a0

const isCloseEnough = (found: TaiDate, searchedFor: TaiDate): boolean => {
  // Here you can define the parameter for either continue the search
  // or start reading the data. Now its set to 30 sec.
  let allowedDifference: number = 30 * 1e6
  if (searchedFor.t - found.t < allowedDifference) {
    return true
  }
  return false
}

export interface InfoJson {
  recorder_id: string,
  start_time: string,
  end_time: string,
  sync_time: string,
  skew_time?: string,
  skew?: number,
  sample_rate: number,
  size: number,
  channels: {name: string, gain: number}[],
  comment: string
}

export class Kum6D6 {
  file: File
  position: number
  buffer: Uint8Array
  bufferOffset: number
  header: Combined6D6Header
  fileMetaDataStart: TaiDate
  fileMetaDataEnd: TaiDate

  constructor(file: File, combinedHeader: Combined6D6Header /* startTime: TaiDate, endTime: TaiDate */) {
    this.file = file
    this.position = 1024
    this.buffer = new Uint8Array(4)
    this.bufferOffset = 0
    this.header = combinedHeader
    this.fileMetaDataStart = combinedHeader.startTime
    this.fileMetaDataEnd = combinedHeader.endTime
  }

  async binarySearch(value: TaiDate, startTime: TaiDate, endTime: TaiDate, startOffset: number, endOffset: number): Promise<TaiDate> {
    if (endTime.t < startTime.t) throw new Error('End-position cannot be smaller than Start-position')

    // Gemessen an SuchZeitpunkt und Dateigröße bzw. Bytelänge von Samples den ersten guess möglichst Nahe am gesuchten Zeitpunkt halten  #

    // 1 sample: 4 byte
    // sample-frame: 4 byte * channel.length
    // bevor ich einlese sorge ich dafür, dass meine position durch 4 teilbar ist
    // dann noch sichergehen, dass ich nicht MITTEN im Frame bin, sondern am Anfang eines Frames

    // resync position:
    // read int32 until an odd number after 4 even numbers is found.
    // that odd number is the start of a meta frame.

    let guessedReadingPosition: number = interpolate(startTime.t, endTime.t, value.t, startOffset, endOffset)
    guessedReadingPosition = Math.floor(guessedReadingPosition / 4) * 4
    // start reading a little bit earlier
    guessedReadingPosition -= 1024 * 16

    let synced: boolean = false
    let evenCounter: number = 0
    while (!synced) {
      let data: DataView = await this.file.read(this.position, 4)
      if (isOdd(data.getInt32(0))) {
        if (evenCounter >= 4) {
          synced = true
        } else {
          evenCounter = 0
          this.position += 4
        }
      } else {
        evenCounter += 1
        this.position += 4
      }
    }
    let found: boolean = false
    let foundOffset: number = 0
    let foundTime: TaiDate = new TaiDate()
    while (!found) {
      await this.read({
        onTimeStamp: async (s, us) => {
          // compare function for TaiDates?
          foundTime = new TaiDate(this.header.startTime.t + BigInt(s) * 100000n + BigInt(us))
          foundOffset = this.position
          found = true
        }
      })
    }
    // foundOffset and foundTime are valid now.

    let closeEnough: boolean = isCloseEnough(foundTime, value)

    if (closeEnough) {
      if (foundTime.t < value.t) {
        return this.binarySearch(value, foundTime, endTime, foundOffset, endOffset)
      } else {
        return this.binarySearch(value, startTime, foundTime, startOffset, foundOffset)
      }
    }

    return foundTime
  }

  static async open(filename: string) {
    let file = await File.open(filename)

    let firstHeader = kum6D6HeaderRead(await file.read(0, 512))
    let secondHeader = kum6D6HeaderRead(await file.read(512, 512))
    let combinedHeader = combine6D6Headers(firstHeader, secondHeader)

    return new Kum6D6(file, combinedHeader)
  }

  async read(callbacks: ReadCallbacks): Promise<boolean> {
    // TODO: Don't seek the file position for every readBlock() call
    let firstWord = await this.file.read(this.position, 4)
    // Because ByteOrder is BigEndian, we can check for n % mod2 === 1.
    if (firstWord.byteLength < 4) return false
    let t = firstWord.getInt32(0)
    if (isOdd(t)) {
      // Check for end of recording.
      if (t === 13) return false
      // if not EoR, read the whole metaFrame.
      let data = await this.file.read(this.position, 16)
      if (data.byteLength !== 16) return false
      this.position += 16
      // after successful read & increasing position - parse metaFrame.
      await parseMetaFrame(data, callbacks)
    } else {
      const p = this.position
      // Position increased by number of channels & channel size.
      this.position += (this.header.channels.length * 4)
      if (typeof callbacks.onSamples === 'function') {
        let sampleData = await this.file.read(p, this.header.channels.length * 4)
        // Make sure the sampleData has the correct length.
        if (sampleData.byteLength < this.header.channels.length * 4) return false
        let samples = new Int32Array(this.header.channels.length)
        // Add read samples to sample-array and return via promise (?)
        for (let i = 0; i < samples.length; ++i) {
          samples[i] = sampleData.getInt32(i * 4)
        }
        await callbacks.onSamples(samples)
      }
    }
    return true
  }

  // Function/Algorithm to seek specific time-points in the recording and
  // retrieving the length of the requested frame

  // metaFrame: 16-byte
  // sample: 4-byte
  // sampleframe: 4-byte channel.length

  async seek(time: TaiDate): Promise<TaiDate> {
    // how to retrieve start(is it after the two headers - 1024?) and end of file
    return await this.binarySearch(time, this.header.startTime, this.header.endTime, this.header.startAddressData, this.header.endAddressData)
    // Moves the file to the requested position
    // Next call to read will yield the sample closest to `time`
  }

  // should it read metaFrames and make conclusions/assumptions?
  async readDesiredDuration(duration: number, instance: Kum6D6) {
    // Duration in seconds?
    let iterations: number = this.header.sampleRate * duration
    let desiredSamples: Int32Array[] = []
    while (desiredSamples.length < iterations) {
      instance.read({
        onSamples: s => {
          desiredSamples.push(s)
        },
      })
    }
  }

  infoJson(): InfoJson {
    return {
      recorder_id: this.header.recorderID,
      start_time: this.header.startTime.toISOString(),
      end_time: this.header.endTime.toISOString(),
      sync_time: this.header.sync.time.toISOString(),
      skew_time: this.header.skew ? this.header.skew.time.toISOString() : undefined,
      skew: this.header.skew ? this.header.skew.deviation : undefined,
      sample_rate: this.header.sampleRate,
      size: this.header.endAddressData * 512,
      channels: this.header.channels,
      comment: this.header.comment
    }
  }
}

async function test() {
  let test = await Kum6D6.open('../test.6d6')

  console.log(test.header)

}

if (require.main === module) {
  test().catch(e => {
    console.error(e)
    process.exit(1)
  })
}

export default Kum6D6
