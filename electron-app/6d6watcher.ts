import { execFile } from 'child_process'
import { InfoJson } from "./kum-6d6"
import { readdir } from 'fs'
import util from 'util'
import path from 'path'
import fs from 'fs'

const execFileAsync = util.promisify(execFile)
const readdirAsync = util.promisify(readdir)

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

// Additoinal checkups needed?

const validateInfo = (info: any): InfoJson => {
  if (typeof info !== 'object' || !info) throw new Error('Invalid InfoJson')
  if (info.start_time.valueOf() > info.end_time.valueOf()) throw new Error('Invalid InfoJson - start_time is greater than end_time.')
  if (info.startAddressData < 0 || !info.startAddressData) throw new Error('Invalid InfoJson - startAddressData invalid.')
  if (info.endAddressData < 0 || !info.endAddressData) throw new Error('Invalid InfoJson - endAddressData invalid.')
  if (info.sampleRate < 0 || !info.sampleRate) throw new Error('Invalid InfoJson - sampleRate invalid.')
  if (typeof info.recorder_id !== 'string' || !info.recorder_id) throw new Error('Invalid InfoJson - recorder_id invalid.')

  return info
}

// Returns the 6d6Info for a given path
const info = async (dir: string, name: string): Promise<Device | null> => {
  try {
    const command: string = binInstalled ? '6d6info' : './public/bin/6d6info'
    const r = await execFileAsync(command, ['--json', path.join(dir, name)])
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
  const devices = (await readdirAsync(devPath)).filter((d: string) => filters.filter(f => f.test(d)).length > 0)
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
