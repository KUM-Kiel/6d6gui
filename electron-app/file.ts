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

  // Closing the file descriptor for system/file safety purposes.
  async close() {
    await this.fd.close()
  }

  // Every call of this function progresses the pointer along the file.
  async read(position: number, data: DataView): Promise<number> {
    let bytes = data.byteLength
    let read = 0
    while (read < bytes) {
      let p = position + read
      // Load 1MB and write portion to data
      if (p < this.start || this.end <= p) {
        this.start = p
        this.end = p
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

export default File
