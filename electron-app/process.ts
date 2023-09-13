const child_process = require('child_process')
const readline = require('readline')
const fs = require('fs')

// Class to set up a process and handle existing ones.
class Process {
  constructor (command, args, onExit) {
    this.process = child_process.spawn(command, args)
    this.paused = false
    this.error = null
    this.exitCode = null
    this.process.on('error', e => {
      this.error = e
      onExit()
    })
    this.process.on('close', code => {
      this.exitCode = code
      onExit()
    })
  }
  // (Pause || Continue) or Cancel a process.
  action (action) {
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
  actions () {
    return [this.paused ? 'continue' : 'pause', 'cancel']
  }
  hasError () {
    return this.error !== null
  }
  isRunning () {
    return this.exitCode === null && this.error === null
  }
  // Set general Standard -OUT/-IN/-ERR handling.
  stdinFromFile (inputPath) {
    if (!this.isRunning()) throw new Error('Process is not running')
    fs.createReadStream(inputPath).pipe(this.process.stdin)
  }
  stdoutToFile (outputPath) {
    this.process.stdout.pipe(fs.createWriteStream(outputPath))
  }
  stdoutToLines (outHandler) {
    const rl = readline.createInterface({
      input: this.process.stdout,
      crlfDelay: Infinity
    })
    rl.on('line', outHandler)
  }
  stderrToFile (errPath) {
    this.process.stderr.pipe(fs.createWriteStream(errPath))
  }
  stderrToLines (errHandler) {
    const rl = readline.createInterface({
      input: this.process.stderr,
      crlfDelay: Infinity
    })
    rl.on('line', errHandler)
  }
  kill () {
    this.process.kill()
  }
}

export default Process
