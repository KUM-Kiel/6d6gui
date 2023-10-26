import { ChildProcess, spawn } from 'child_process'
import { Action } from './spawnProcess'
import readline from 'readline'
import fs from 'fs'

// Class to set up a process and handle existing ones.
class Process {
  process: ChildProcess
  paused: boolean
  error: Error | null
  exitCode: number | null

  constructor (command: string, args: string[], onExit: Function) {
    this.process = spawn(command, args)
    this.paused = false
    this.error = null
    this.exitCode = null
    this.process.on('error', (e: Error) => {
      this.error = e
      onExit()
    })
    this.process.on('close', (code: number) => {
      this.exitCode = code
      onExit()
    })
  }
  // (Pause || Continue) or Cancel a process.
  action (action: string) {
    if (this.isRunning()) {
      if (action === 'cancel') {
        if (this.paused) {
          this.process.kill('SIGCONT')
        }
        this.process.kill()
      } else if (action === 'pause' && !this.paused) {
        this.process.kill('SIGSTOP')
        this.paused = true
      } else if (action === 'continue' && this.paused) {
        this.process.kill('SIGCONT')
        this.paused = false
      }
    }
  }
  actions (): Action[] {
    return [this.paused ? 'continue' : 'pause', 'cancel']
  }
  hasError () {
    return this.error !== null
  }
  isRunning () {
    return this.exitCode === null && this.error === null
  }
  // Set general Standard -OUT/-IN/-ERR handling.
  stdinFromFile (inputPath: string) {
    if (!this.isRunning()) throw new Error('Process is not running')
    fs.createReadStream(inputPath).pipe(this.process.stdin!)
  }
  stdoutToFile (outputPath: string) {
    if (!this.process.stdout) throw Error('Wäh!')
    this.process.stdout.pipe(fs.createWriteStream(outputPath))
  }
  stdoutToLines (outHandler:  (a: string) => void) {
    const rl = readline.createInterface({
      input: this.process.stdout!,
      crlfDelay: Infinity
    })
    rl.on('line', outHandler)
  }
  stderrToFile (errPath: string) {
    if (!this.process.stderr) throw Error('Wäh!')
    this.process.stderr.pipe(fs.createWriteStream(errPath))
  }
  stderrToLines (errHandler: ((...args: any[]) => void)) {
    const rl = readline.createInterface({
      input: this.process.stderr!,
      crlfDelay: Infinity
    })
    rl.on('line', errHandler)
  }
  kill () {
    this.process.kill()
  }
}

export default Process
