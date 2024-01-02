import TaiDate from "./tai"
import util from 'util'
import fs from 'fs'

const readFile = util.promisify(fs.readFile)

// profile shotNr TaiDate(julday, y, h, m, s, ms) lat lon depth
export interface Shot {
  profile: string,
  shotNr: number,
  lat: number,
  lon: number,
  depth: number,
  time: TaiDate
}

const getField = (fields: string[], name: string) => {
  let n = fields.indexOf(name)
  if (n < 0) throw new Error('Missing field "' + name + '" in shot file')
  return n
}

export const parseShotfile = (fileContent: string): Shot[] | null => {
  return parseShotfileDat(fileContent) || parseShotFileSend(fileContent)
}

export const parseShotfileDat = (fileContent: string): Shot[] | null => {
  const lines: string[] = fileContent.split(/\r?\n/g).filter(v => v)
  const names: string[] = lines[0].split(/[ \t]+/g)

  const profileIndex = names.indexOf('profile')
  const shotNrIndex = names.indexOf('shotNr')
  const juldayIndex = names.indexOf('julday')
  const yIndex = names.indexOf('y')
  const hIndex = names.indexOf('h')
  const mIndex = names.indexOf('m')
  const sIndex = names.indexOf('s')
  const msIndex = names.indexOf('ms')
  const latIndex = names.indexOf('lat')
  const lonIndex = names.indexOf('lon')
  const depthIndex = names.indexOf('depth')

  if (shotNrIndex < 0 || juldayIndex < 0 || yIndex < 0 || hIndex < 0 || mIndex < 0 || sIndex < 0 || msIndex < 0 || latIndex < 0 || lonIndex < 0 || depthIndex < 0 ) return null

  const shots: Shot[] = []
  for (let i = 1; i < lines.length; ++i) {
    const fields = lines[i].split(/[ \t]+/g)
    if (fields.length !== names.length) {
      console.log({names,fields})
      return null
    }
    const profile = profileIndex >= 0 ? fields[profileIndex] : ''
    const shotNr = parseInt(fields[shotNrIndex], 10)
    const julday = parseInt(fields[juldayIndex], 10)
    const y = parseInt(fields[yIndex], 10)
    const h = parseInt(fields[hIndex], 10)
    const m = parseInt(fields[mIndex], 10)
    const s = parseInt(fields[sIndex], 10)
    const ms = parseFloat(fields[msIndex])
    const lat = parseFloat(fields[latIndex])
    const lon = parseFloat(fields[lonIndex])
    const depth = parseFloat(fields[depthIndex])
    const time = new TaiDate(y, 1, julday, h, m, s, ms * 1000)

    shots.push({
      profile, shotNr, lat, lon, depth, time
    })
  }
  return shots
}

export const parseShotFileSend = (fileContent: string): Shot[] => {
  const regex: RegExp = /^([^ ]+)\s+(\d+)\s+(\d+)\.(\d+)\.(\d+)\s+(\d+):(\d+):(\d+(\.\d+)?)\s+([0-9.+-]+)\s+([0-9.+-]+)$/gm
  return Array.from(fileContent.matchAll(regex)).map(match => {
    let s = parseFloat(match[8])
    return {
      profile: match[1],
      shotNr: parseInt(match[2]),
      lat: parseFloat(match[10]),
      lon: parseFloat(match[11]),
      depth: 0,
      time: new TaiDate(parseInt(match[3]), parseInt(match[4]), parseInt(match[5]), parseInt(match[6]), parseInt(match[7]), Math.floor(s), Math.floor(1e6 * (s - Math.floor(s))))
    }
  })
}

export const readShotfile = async (filename: string): Promise<Shot[]> => {
  let parsedFile = parseShotfile(await readFile(filename, 'utf-8'))
  if (parsedFile === null) throw new Error(`Can't parse the given file.`)
  return parsedFile
}


const test = async () => {
  console.log((await readShotfile('../BGR18-2R2.send')).map(s => ({...s, date: s.time.toISOString()})))
}
if (require.main === module) {
  test().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
