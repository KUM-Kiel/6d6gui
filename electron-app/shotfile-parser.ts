import TaiDate from "./tai"
import util from 'util'
import fs from 'fs'

const readFile = util.promisify(fs.readFile)

/**
 * This parser for shotfiles is pretty limited in its capabilities to
 * read-in different structures than the ones defined below.
 *
 * As there's no standard for shotfiles, the defined structures
 * accepted by this parser are the following ones:
 *
 * I
 * Top-row:  PROFILE,SHOT,TIME,LATITUDE,LONGITUDE,WATER DEPTH,SOURCE DEPTH,DISTANCE
 * example:  2017,2001,2023-11-09T09:50:57.500Z,54.328,10.178,800,3,300
 *
 * II
 * Top-row: ShotNr, julday, y,   h, m, s, ms,     lat,       lon,       depth
 * example: 1       313     2023 9  45 57 500.000 54.3283244 10.1780946 800
 *
 */

export interface Shot {
  profile: string,
  shotNr: number,
  time: TaiDate,
  lat: number,
  lon: number,
  waterDepth: number,
  sourceDepth: number,
  distance: number | null
}

// Development legacy.
const getField = (fields: string[], name: string) => {
  let n = fields.indexOf(name)
  if (n < 0) throw new Error('Missing field "' + name + '" in shot file')
  return n
}

export const parseShotfile = (fileContent: string): Shot[] | null => {
  return parseShotfileCsv(fileContent)
}

export const parseShotfileCsv = (fileContent: string): Shot[] | null => {
  const lines: string[] = fileContent.split(/\r?\n/g).map(v => v.trim()).filter(v => v)
  const names: string[] = lines[0].toLowerCase().split(',').map(v => v.trim())

  const profileIndex = names.indexOf('profile')
  const shotNrIndex = names.indexOf('shot')
  const timeIndex = names.indexOf('time')
  const latIndex = names.indexOf('latitude')
  const lonIndex = names.indexOf('longitude')
  const waterDepthIndex = names.indexOf('water depth')
  const sourceDepthIndex = names.indexOf('source depth')
  const distanceIndex = names.indexOf('distance')

  if (shotNrIndex < 0 || timeIndex < 0 || latIndex < 0 || lonIndex < 0) return null

  const shots: Shot[] = []
  for (let i = 1; i < lines.length; ++i) {
    const fields = lines[i].split(',').map(v => v.trim())
    if (fields.length !== names.length) {
      return null
    }
    const profile = profileIndex >= 0 ? fields[profileIndex] : ''
    const shotNr = parseInt(fields[shotNrIndex], 10)
    const time = new TaiDate(fields[timeIndex])
    const lat = parseFloat(fields[latIndex])
    const lon = parseFloat(fields[lonIndex])
    const waterDepth = waterDepthIndex >= 0 ? parseFloat(fields[waterDepthIndex]) : 0
    const sourceDepth = sourceDepthIndex >= 0 ? parseFloat(fields[sourceDepthIndex]) : 0
    const distance = distanceIndex >= 0 ? parseFloat(fields[distanceIndex]) : null

    shots.push({
      profile, shotNr, time, lat, lon, waterDepth, sourceDepth, distance
    })
  }
  return shots.length > 0 ? shots : null
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

  if (shotNrIndex < 0 || juldayIndex < 0 || yIndex < 0 || hIndex < 0 || mIndex < 0 || sIndex < 0 || msIndex < 0 || latIndex < 0 || lonIndex < 0 || depthIndex < 0) return null

  const shots: Shot[] = []
  for (let i = 1; i < lines.length; ++i) {
    const fields = lines[i].split(/[ \t]+/g)
    if (fields.length !== names.length) {
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
    const waterDepth = parseFloat(fields[depthIndex])
    const time = new TaiDate(y, 1, julday, h, m, s, ms * 1000)

    shots.push({
      profile, shotNr, lat, lon, waterDepth, sourceDepth: 0, time, distance: null
    })
  }
  return shots.length > 0 ? shots : null
}

// Works explicitly on a structure like the following:
// 'linename, shotpoint, gps-time:date, x, y'
export const parseShotFileSend = (fileContent: string): Shot[] | null => {
  const regex: RegExp = /^([^ ]+)\,(\d+)\,(\d+)\,(\d+)\-(\d+)\-(\d+)[T]+(\d+):(\d+):(\d+(\.\d+)?)\s+([0-9.+-]+)\s+([0-9.+-]+)$/gm
  const shots = Array.from(fileContent.matchAll(regex)).map(match => {
    let s = parseFloat(match[8])
    return {
      profile: match[1],
      shotNr: parseInt(match[2]),
      lat: parseFloat(match[11]),
      lon: parseFloat(match[10]),
      waterDepth: 0,
      sourceDepth: 0,
      time: new TaiDate(parseInt(match[3]), parseInt(match[4]), parseInt(match[5]), parseInt(match[6]), parseInt(match[7]), Math.floor(s), Math.floor(1e6 * (s - Math.floor(s)))),
      distance: null
    }
  })
  return shots.length > 0 ? shots : null
}

export const readShotfile = async (filename: string): Promise<Shot[]> => {
  let parsedFile = parseShotfile(await readFile(filename, 'utf-8'))
  console.log(parsedFile)
  if (parsedFile === null) throw new Error(`Can't parse the given file.`)
  return parsedFile
}
