// const { waitFor } = require('@testing-library/react')
const path = require('path')

import Process from './process'

// Filling up single digits with prepending zeros.
const pad = n => (n < 10 ? '0' : '') + n

const calcPercentage = (done, total) => {
  return (100 * done) / total
}
// ETA = Estimated time of arrival (completion)
const calcETA = (done, total, elapsed) => {
  return formatTime(Math.ceil(((total - done) * (elapsed / done)) / 1000))
}

// Changing the display of numbers according to their size.
const significant = n => {
  if (n < 10) {
    return n.toFixed(2)
  } else if (n < 100) {
    return n.toFixed(1)
  } else {
    return n.toFixed(0)
  }
}

// Returning a simpler representation of a given amount of bytes.
const formatBytes = bytes => {
  if (bytes < 1000) {
    return bytes + 'B'
  } else if (bytes < 1e6) {
    return significant(bytes / 1000) + 'kB'
  } else if (bytes < 1e9) {
    return significant(bytes / 1e6) + 'MB'
  } else if (bytes < 1e12) {
    return significant(bytes / 1e9) + 'GB'
  } else {
    return significant(bytes / 1e12) + 'TB'
  }
}

// Handling tasks and creating the different 6D6 processes.
class TaskManager {



  constructor (onUpdate) {
    this.tasks: Process[] = {}
    this.actions = {}
    this.nextId = 0n
    this.onUpdate = onUpdate
  }
  action (id, action) {
    const a = this.actions[id]
    if (typeof a === 'function') {
      a(action)
    }
    this.update() // Does this even do something?
  }
  update () {
    this.onUpdate(this.getTasks())
  }
  getTasks () {
    const tasks = []
    for (let id in this.tasks) {
      tasks.push(this.tasks[id])
    }
    return tasks
  }
  getId () {
    const id = this.nextId.toString()
    this.nextId += 1n
    return id
  }
  $6d6copy (from, to, filename, binInstalled) {
    const id = this.getId()
    const toChecked = /\.6d6$/.test(to) ? to : path.join(to, filename + '.6d6')
    /*   const command = binInstalled ? '6d6copy' :
'./bin/6d6copy' */
    const p = new Process(
      '6d6copy',
      ['--json-progress', '--', from, toChecked],
      () => {
        this.tasks[id].finished = true
        this.tasks[id].actions = ['confirm']
        waitFor(200)
        this.update()
      }
    )
    // Pipes the output of the process into a task object.
    p.stdoutToLines(line => {
      const { done, total, elapsed } = JSON.parse(line)
      // TODO
      this.tasks[id].percentage = calcPercentage(done, total)
      this.tasks[id].eta = calcETA(done, total, elapsed)
      this.tasks[id].progress = formatBytes(done) + '/' + formatBytes(total)
      this.update()
    })
    this.actions[id] = action => {
      if (this.tasks[id].finished) {
        if (action === 'confirm') {
          delete this.tasks[id]
          delete this.actions[id]
          this.update()
        }
      } else {
        p.action(action)
        this.tasks[id].actions = p.actions()
        this.update()
      }
    }
    this.tasks[id] = {
      id,
      title: '6d6copy',
      description: from + ' -> ' + to + '/' + filename + '.6d6',
      progress: '0B',
      percentage: 0,
      eta: null,
      finished: false,
      actions: p.actions()
    }
  }
  $6d6read (from, to, binInstalled) {
    const id = this.getId()
    const toChecked = /\.s2z$/.test(to) ? to : to + '.s2x'
    /*     const command = binInstalled ? '6d6read' :
    './bin/6d6read' */
    const p = new Process('6d6read', ['--json-progress'], () => {
      this.tasks[id].finished = true
      this.tasks[id].actions = ['confirm']
      console.log(this.actions[id])
      this.update()
    })
    p.stderrToLines(line => {
      console.log(line)
      const { done, total, elapsed } = JSON.parse(line)
      this.tasks[id].percentage = calcPercentage(done, total)
      this.tasks[id].eta = calcETA(done, total, elapsed)
      this.tasks[id].progress = formatBytes(done) + '/' + formatBytes(total)
      this.update()
    })
    p.stdinFromFile(from)
    p.stdoutToFile(toChecked)
    this.actions[id] = action => {
      if (this.tasks[id].finished) {
        if (action === 'confirm') {
          delete this.tasks[id]
          delete this.actions[id]
          this.update()
        }
      } else {
        p.action(action)
        this.tasks[id].actions = p.actions()
        this.update()
      }
    }
    this.tasks[id] = {
      id,
      title: '6d6read',
      description: from + ' -> ' + to + '.s2x',
      progress: '0B',
      percentage: 0,
      eta: null,
      finished: false,
      actions: p.actions()
    }
  }
  $6d6mseed (data, tempPath, binInstalled) {
    let options = ['--json-progress']
    let insert = ''
    // All included/received options get added to the command call.
    // If the data.station object is empty, the command won't run.
    if (!/ /.test(data.station)) {
      options.push(`--station=${data.station}`)
      if (data.location !== '') {
        options.push(`--location=${data.location}`)
      }
      if (data.network !== '') {
        options.push(`--network=${data.network}`)
      }
      if (data.channels !== '') {
        options.push(`--channels=${data.channels}`)
      }
      if (data.destPath !== '') {
        insert = data.destPath + '/' + data.template
      }
      if (data.resample){
        options.push('--resample')
      }
      if (data.ignoreSkew) {
        options.push('--ignore-skew')
      }
      if (data.cut === 0) {
        options.push(`--no-cut`)
      } else if (data.cut !== 86400) {
        options.push(`--cut=${data.cut}`)
      }
      let loggingPath = convertTemplateToPath(insert, data.station)
      if (data.logfile) {
        options.push(`--logfile=${path.join(loggingPath, 'logfile.txt')}`)
      }
      if (data.auxfile) {
        options.push(`--auxfile=${path.join(loggingPath, 'engineering-data.csv')}`)
      }
      options.push(`--output=${insert}`)

      if(data.timeChoice === 'both'){
        options.push(`--start-time=${data.startDate + 'T' + data.startTime + 'Z'}`)
        options.push(`--end-time=${data.endDate + 'T' + data.endTime + 'Z'}`)
      } else if(data.timeChoice === 'start'){
        options.push(`--start-time=${data.startDate+ 'T' +data.startTime + 'Z'}`)
      } else if(data.timeChoice === 'end'){
        options.push(`--end-time=${data.endDate + 'T' + data.endTime + 'Z'}`)
      }
    } else {
      return false
    }
    options.push(tempPath)
    const id = this.getId()
    /*     const command = binInstalled ? '6d6mseed' :
    pathos.join(__dirname, '/bin/6d6mseed')
    console.log('-----------------------------------------', command) */
    console.log('6d6mseed with:', options)
    const p = new Process('6d6mseed', options, () => {
      this.tasks[id].finished = true
      this.tasks[id].actions = ['confirm']
      this.update()
      console.log(this.actions[id])
    })
    p.stdoutToLines(line => {
      const { done, total, elapsed } = JSON.parse(line)
      // TODO ?
      this.tasks[id].percentage = calcPercentage(done, total)
      this.tasks[id].eta = calcETA(done, total, elapsed)
      this.tasks[id].progress = formatBytes(done) + '/' + formatBytes(total)
      this.update()
    })
    this.actions[id] = action => {
      if (this.tasks[id].finished) {
        if (action === 'confirm') {
          delete this.tasks[id]
          delete this.actions[id]
          this.update()
        }
      } else {
        p.action(action)
        this.tasks[id].actions = p.actions()
        this.update()
      }
    }
    let convertedInsert = insert.replace('%S', data.station)
    convertedInsert.replace
    // convertTemplate(dataate) - wofür war das nochmal gedacht?
    this.tasks[id] = {
      id,
      title: '6d6mseed',
      description: tempPath + ' -> ' + convertedInsert,
      progress: '0B',
      percentage: 0,
      eta: null,
      finished: false,
      actions: p.actions()
    }
  }
}

// Converting a given full path to create a path to the 'main' directory.
const convertTemplateToPath = (input, station) => {
  let temp = input.split('/')
  let result = []
  for (let i = 0; i <= temp.length; i++) {
    if (!/%/.test(temp[i])) {
      if(temp[i] !== ''){
        result.push(temp[i])
      }
    } else {
      if (/%S/.test(temp[i])) {
        result.push(temp[i].replace('%S', station))
      }
      break
    }
  }
  return  path.join('/', ...result)
}

const formatTime = s => {
  let r = pad(s % 60)
  s = Math.floor(s / 60)
  r = pad(s % 60) + ':' + r
  s = Math.floor(s / 60)
  if (s > 0) {
    r = s + ':' + r
  }
  return r
}

export default TaskManager
