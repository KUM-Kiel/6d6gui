
const fs = require('fs')

let lat = 54.3283244
let lon = 10.1780946
let depth = 800

let shotNr = 1

let file = `shotNr julday y h m s ms lat lon depth\n`

let time = Date.UTC(2023, 10, 9, 9, 45, 57, 500)

let endTimestamp = Date.UTC(2023, 10, 12, 9, 45)

const monthStarts = [
  0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334
]
const isLeapYear = y => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)
const julday = d => d.getUTCDate() + monthStarts[d.getUTCMonth()] + (isLeapYear(d.getUTCFullYear()) && d.getUTCMonth() > 1)

while (time < endTimestamp) {
  let d = new Date(time)
  file += `${shotNr} ${julday(d)} ${d.getUTCFullYear()} ${d.getUTCHours()} ${d.getUTCMinutes()} ${d.getUTCSeconds()} ${d.getUTCMilliseconds().toFixed(3)} ${lat} ${lon} ${depth}\n`
  ++shotNr
  time += 60000
}

fs.writeFileSync('shotFileTest.txt', file)
