import { FileHandle, open } from 'fs/promises'

export class File {
  fd: FileHandle
  start: number
  end: number
  buffer: Uint8Array

  constructor(fd: FileHandle) {
    this.fd = fd
    this.start = 0
    this.end = 0
    this.buffer = new Uint8Array(1024 * 1024)
  }

  static async open(filename: string): Promise<File> {
    let fd = await open(filename, 'r')
    return new File(fd)
  }

  async close() {
    await this.fd.close()
  }

  async read(position: number, data: DataView): Promise<number> {
    let bytes = data.byteLength
    let read = 0
    while (read < bytes) {
      let p = position + read
      // Load 1MB and write portion to data
      if (this.start > p || this.end <= p) {
        this.start = this.buffer.length * Math.floor(p / this.buffer.length)
        let result = await this.fd.read(this.buffer, 0, this.buffer.length, this.start)
        this.end = this.start + result.bytesRead
      }
      if (this.end <= p) {
        // End of file reached, return shorter buffer
        return read
      }
      let count = Math.min(this.end - p, bytes - read)
      let bufferOffset = p - this.start
      for (let i = 0; i < count; ++i) {
        data.setUint8(read + i, this.buffer[bufferOffset + i])
      }
      read += count
    }
    return read
  }
}

const test = async () => {
  let file = await File.open('test.txt')
  let data = new DataView(new ArrayBuffer(4))
  console.log(await file.read(16, data))
  console.log(await file.read(32, data))
  await file.close()
}

export default File
