export class Pauser {
  paused: boolean
  cancelled: boolean
  queue: {
    resolve: () => void,
    reject: (e: string) => void
  }[]

  constructor() {
    this.paused = false
    this.cancelled = false
    this.queue = []
  }
  pause() {
    this.paused = true
  }
  resume() {
    this.paused = false
    this.queue.forEach(({resolve}) => resolve())
    this.queue.length = 0
  }
  cancel() {
    this.cancelled = true
    this.queue.forEach(({reject}) => reject('cancelled'))
    this.queue.length = 0
  }
  whilePaused(): Promise<void> {
    if (this.cancelled) {
      return Promise.reject('cancelled')
    }
    if (this.paused) {
      return new Promise((resolve, reject) => {
        this.queue.push({resolve, reject})
      })
    } else {
      return Promise.resolve()
    }
  }
}

export default Pauser
