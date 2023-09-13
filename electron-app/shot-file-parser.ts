import TaiDate from "./tai"

const fs = require('fs')
const util = require('util')

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

export const parseShotFile = (fileContent: string): Shot[] => {
  const lines = fileContent.split(/\r?\n/g).filter(v => v)
  const names = lines[0].split(/[ \t]+/g)
  const nameIndices = {
    profile: names.indexOf('profile'),
    shotNr: getField(names, 'shotNr'),
    julday: getField(names, 'julday'),
    y: getField(names, 'y'),
    h: getField(names, 'h'),
    m: getField(names, 'm'),
    s: getField(names, 's'),
    ms: getField(names, 'ms'),
    lat: getField(names, 'lat'),
    lon: getField(names, 'lon'),
    depth: getField(names, 'depth')
  }
  const shots: Shot[] = []
  for (let i = 1; i < lines.length; ++i) {
    const fields = lines[i].split(/[ \t]+/g)
    if (fields.length !== names.length) {
      console.log({names,fields})
      throw new Error('Wrong column count')}
    const profile = nameIndices.profile >= 0 ? fields[nameIndices.profile] : ''
    const shotNr = parseInt(fields[nameIndices.shotNr], 10)
    const julday = parseInt(fields[nameIndices.julday], 10)
    const y = parseInt(fields[nameIndices.y], 10)
    const h = parseInt(fields[nameIndices.h], 10)
    const m = parseInt(fields[nameIndices.m], 10)
    const s = parseInt(fields[nameIndices.s], 10)
    const ms = parseFloat(fields[nameIndices.ms])
    const lat = parseFloat(fields[nameIndices.lat])
    const lon = parseFloat(fields[nameIndices.lon])
    const depth = parseFloat(fields[nameIndices.depth])
    const time = new TaiDate(y, 1, julday, h, m, s, ms * 1000)

    shots.push({
      profile, shotNr, lat, lon, depth, time
    })
  }
  return shots
}

export const parseShotFileSend = (fileContent: string): Shot[] => {
  const regex = /^([^ ]+)\s+(\d+)\s+(\d+)\.(\d+)\.(\d+)\s+(\d+):(\d+):(\d+)\.(\d+)\s+([0-9.+-]+)\s+([0-9.+-]+)$/gm
  return Array.from(fileContent.matchAll(regex)).map(match => ({
    profile: match[1],
    shotNr: parseInt(match[2]),
    lat: parseFloat(match[10]),
    lon: parseFloat(match[11]),
    depth: 0,
    time: new TaiDate(parseInt(match[3]), parseInt(match[4]), parseInt(match[5]), parseInt(match[6]), parseInt(match[7]), parseInt(match[8]), Math.round(1e6 * parseFloat('0.' + match[9])))
  }))
}

export const readShotFile = async (fileName: string): Promise<Shot[]> => {
  return parseShotFile(await readFile(fileName, 'utf-8'))
}

export const readShotFileSend = async (fileName: string): Promise<Shot[]> => {
  return parseShotFileSend(await readFile(fileName, 'utf-8'))
}

const test = async () => {
  console.log((await readShotFileSend('../BGR18-2R2.send')).map(s => ({...s, date: s.time.toISOString()})))
}
if (require.main === module) {
  test().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
