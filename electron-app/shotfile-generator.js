const fs = require('fs')

// This was used during the development to generate exemplary shotfiles.
let file = `Profile,Shot,Time,Latitude,Longitude,Water Depth,Source Depth\n`

// Can be changed by user.
let lat = 54.3283244
let lon = 10.1780946
let depth = 800
let shotNr = 1
let rnd = 1104383
let depthWater = 800
let depthSource = 3

let time = Date.UTC(2017, 1, 2, 9, 50, 57, 500)
let endTimestamp = Date.UTC(2017, 1, 8, 1, 0)

// Shouldn't be changed.
const monthStarts = [
  0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334
]
const isLeapYear = y => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)
const julday = d => d.getUTCDate() + monthStarts[d.getUTCMonth()] + (isLeapYear(d.getUTCFullYear()) && d.getUTCMonth() > 1)

const createShotData = async (start, end, shotIntervallMS) => {
  while (start < end) {
    let d = new Date(start)
    file += `${rnd},${shotNr},${d.toISOString()},${lat},${lon},${depthWater},${depthSource}\n`
    ++shotNr
    start += shotIntervallMS
  }
  return file
}

const createFile = async () => {
  let data = await createShotData(time, endTimestamp, 60000)
  fs.writeFileSync('shotFileGen.csv', data)
}

createFile()

module.exports = createShotData
