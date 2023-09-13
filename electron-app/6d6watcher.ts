import { InfoJson } from "./kum-6d6"

const fs = require('fs')
const util = require('util')
const path = require('path')
const child_process = require('child_process')

const readdir = util.promisify(fs.readdir)
const execFile = util.promisify(child_process.execFile)

// Filter to only look for relevant files (devices).
const filters: RegExp[] = [/^sd[a-z]\d+$/, /^mmcblk\d+p\d+$/]

const devPath: string = '/dev'

// Checking whether 6d6compat is installed.
const binInstalled: boolean = process.platform !== 'win32' && fs.existsSync('/usr/local/bin/6d6info')

export interface Device {
  directory: string,
  name: string,
  info: InfoJson
}

const validateInfo = (info: any): InfoJson => {
  // TODO
  if (typeof info !== 'object' || !info) throw new Error('Invalid InfoJson')
  return info
}

// Returns the 6d6Info for a given path
const info = async (dir: string, name: string): Promise<Device | null> => {
  try {
    const command: string = binInstalled ? '6d6info' : './public/bin/6d6info'
    const r = await execFile(command, ['--json', path.join(dir, name)])
    return {
      directory: dir,
      name: name,
      info: validateInfo(JSON.parse(r.stdout))
    }
  } catch (e) {
    return null
  }
}

// Scans the devPath for relevant (meaning a 6d6info is returned) devices.
const scanDevices = async (): Promise<Device[]> => {
  if (process.platform === 'win32') return []
  const devices = (await readdir(devPath)).filter((d: string) => filters.filter(f => f.test(d)).length > 0)
  const result = []
  for (let i = 0; i < devices.length; ++i) {
    const d = await info(devPath, devices[i])
    if (d !== null) result.push(d)
  }
  console.log(result)
  return result
}

// A watcher to check for a devicelist update/change every second.
const Watcher = (onChange: Function) => {
  let devices: Device[] = []
  const update = (l: Device[]) => {
    devices = l
    onChange(devices)
  }
  scanDevices().then(update)
  setInterval(() => {
    scanDevices().then(update)
  }, 1000)
  return () => devices
}

export default Watcher
