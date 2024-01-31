import { MetaFrameCallbacks, parseMetaFrame } from './6d6-meta-data-converter'
import combine6d6Headers, { Combined6d6Header } from './6d6-header-validation'
import kum6D6HeaderRead, { Channel, Kum6d6Header } from './6d6-header'
import TaiDate from './tai'
import File from './file'

const isOdd = (n: number): boolean => {
  return (n % 2) === 1
}

interface ReadCallbacks extends MetaFrameCallbacks {
  onSamples?: (samples: Int32Array) => void | Promise<void>
}
// Development legacy.
const interpolate = (t0: bigint, t1: bigint, t: bigint, a0: number, a1: number): number => Number(t - t0) / Number(t1 - t0) * (a1 - a0) + a0

const isCloseEnough = (found: TaiDate, searchedFor: TaiDate): boolean => {
  // Here you can define the parameter for either continue the search
  // or start reading the data. Now its set to 30 sec.
  let allowedDifference: number = 30 * 1e6
  let d = searchedFor.t - found.t
  if (d > 0 && d <= allowedDifference) {
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
  channels: Channel[],
  comment: string
}

export class Kum6D6 {
  file: File | null
  position: number
  header: Combined6d6Header
  fileMetaDataStart: TaiDate
  fileMetaDataEnd: TaiDate
  word: DataView
  sampleView: DataView
  sampleFrame: Int32Array
  metaView: DataView

  constructor(file: File, combinedHeader: Combined6d6Header) {
    this.file = file
    this.position = 1024
    this.header = combinedHeader
    this.fileMetaDataStart = combinedHeader.startTime
    this.fileMetaDataEnd = combinedHeader.endTime
    this.word = new DataView(new ArrayBuffer(4))
    this.sampleView = new DataView(new ArrayBuffer(combinedHeader.channels.length * 4))
    this.sampleFrame = new Int32Array(combinedHeader.channels.length)
    this.metaView = new DataView(new ArrayBuffer(16))
  }
/**
 * 1 sample:      4 byte
 * sample-frame:  4 byte * channels.length
 *
 * Before we try to read we adjust the reading position to the beginning of a
 * frame.
 *
 */
  async binarySearch(value: TaiDate, startTime: TaiDate, endTime: TaiDate, startOffset: number, endOffset: number): Promise<TaiDate> {
    if (this.file === null) throw new Error('Already closed')
    if (endTime.t < startTime.t) throw new Error('End-position cannot be smaller than start-position')
    if (value.t < startTime.t || value.t > endTime.t) throw new Error('Not in file')

    let guessedReadingPosition: number = startOffset + Math.floor((endOffset - startOffset) / 2)
    guessedReadingPosition = Math.floor(guessedReadingPosition / 4) * 4

    let position = guessedReadingPosition

    // Make sure that the position is starting at the beginning of a frame.
    let synced: boolean = false
    let evenCounter: number = 0
    while (!synced) {
      let temp = await this.file.read(position, this.word)
      if (temp < 4) throw "EOF"
      if (isOdd(this.word.getInt32(0))) {
        if (evenCounter >= 4) {
          synced = true
        } else {
          evenCounter = 0
          position += 4
        }
      } else {
        evenCounter += 1
        position += 4
      }
    }
    // As soon as we synced our position, the following frames are read.
    this.position = position
    let found: boolean = false
    let foundOffset: number = 0
    let foundTime: TaiDate = new TaiDate()
    while (!found) {
      await this.read({
        onTimeStamp: async (s, us, p) => {
          foundTime = new TaiDate(this.header.startTime.t + BigInt(s) * 1000000n + BigInt(us))
          foundOffset = p
          found = true
        }
      })
    }
    // foundOffset and foundTime are valid now.
    if (!isCloseEnough(foundTime, value)) {
      if (foundTime.t < value.t) {
        return this.binarySearch(value, foundTime, endTime, foundOffset, endOffset)
      } else {
        return this.binarySearch(value, startTime, foundTime, startOffset, foundOffset)
      }
    }

    const sampleTime = BigInt(1e6 / this.header.sampleRate)

    let t = foundTime.t
    while (t < value.t) {
      await this.read({
        onSamples: async () => {
          t += sampleTime
        },
        onTimeStamp: async (s, us) => {
          t = BigInt(s) * 1000000n + BigInt(us) + this.header.startTime.t
        }
      })
    }
    return new TaiDate(t)
  }

  static async open(filename: string): Promise<Kum6D6> {
    let file = await File.open(filename)
    let buffer1 = new DataView(new ArrayBuffer(512))
    let buffer2 = new DataView(new ArrayBuffer(512))
    if (await file.read(0, buffer1) !== 512) throw new Error('short read')
    if (await file.read(512, buffer2) !== 512) throw new Error('short read')
    let firstHeader: Kum6d6Header = kum6D6HeaderRead(buffer1)
    let secondHeader: Kum6d6Header = kum6D6HeaderRead(buffer2)
    let combinedHeader: Combined6d6Header = combine6d6Headers(firstHeader, secondHeader)

    return new Kum6D6(file, combinedHeader)
  }

  // Propper closing of the File(-handlers) - keeping the system safer.
  async close(): Promise<void> {
    if (this.file === null) throw new Error('Already closed')
    await this.file.close()
    this.file = null
  }

  async read(callbacks: ReadCallbacks): Promise<boolean> {
    if (this.file === null) throw new Error('Already closed')
    const p: number = this.position
    // Because ByteOrder is BigEndian, we can check for n % mod2 === 1.
    if (await this.file.read(p, this.word) < 4) return false
    let t: number = this.word.getInt32(0)
    if (isOdd(t)) {
      // Check for end of recording.
      if (t === 13) return false
      // if not EoR, read the whole metaFrame.
      if (await this.file.read(p, this.metaView) !== 16) return false
      this.position += 16
      // after successful read & increase of position - parse metaFrame.
      await parseMetaFrame(this.metaView, callbacks, p)
    } else {
      // Position increased by number of channels & channel size.
      this.position += (this.header.channels.length * 4)
      if (typeof callbacks.onSamples === 'function') {
        // Make sure the sampleData has the correct length.
        if (await this.file.read(p, this.sampleView) < this.header.channels.length * 4) return false
        let samples: Int32Array = this.sampleFrame

        for (let i = 0; i < samples.length; ++i) {
          samples[i] = this.sampleView.getInt32(i * 4)
        }
        await callbacks.onSamples(samples)
      }
    }
    return true
  }

/**
 * Function/Algorithm to seek specific time-points in the recording and
 * retrieving the length of the requested frame.
 *
 * metaFrame:   16-byte
 * sample:      4-byte
 * sampleframe: 4-byte * channel.length
 **/

  seek(time: TaiDate): Promise<TaiDate> {
    return this.binarySearch(time, this.header.startTime, this.header.endTime, this.header.startAddressData * 512, this.header.endAddressData * 512)
    // Start/End Adress Data points to a sd-card memory-block and needs to be
    // converted into 'bytes' by multiplying the value with 512.
    // Moves the file to the requested position.
    // Next call to read will yield the sample closest to `time`.
  }

  async readDesiredDuration(duration: number, instance: Kum6D6): Promise<void> {
    let iterations: number = this.header.sampleRate * duration
    let desiredSamples: Int32Array[] = []
    while (desiredSamples.length < iterations) {
      instance.read({
        onSamples: s => {
          desiredSamples.push(s)
        }
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

export default Kum6D6
