import { readShotfile, Shot } from './shotfile-parser'
import { SegyWriter } from './segy-writer'
import { earthDistance } from './geodesy'
import Kum6D6 from './kum-6d6'
import TaiDate from './tai'

import { Pauser } from './pauser'
import path from 'path'

const checkShotFileIntergrity = (shotFile: Shot[], startTimeRec: TaiDate, endTimeRec: TaiDate): boolean => {
  for (let i = 0; i < shotFile.length; ++i) {
    if (shotFile[i].shotNr !== i + shotFile[0].shotNr)
      throw "ShotFile ShotNr. not consecutive."
  }
  if (startTimeRec.valueOf() >= shotFile[0].time.valueOf())
    throw "Shots begin before the recording even started."

  if (endTimeRec.valueOf() <= shotFile[shotFile.length - 1].time.valueOf())
    throw "The last shot is fired after the end of the recording."

  return true
}

// Generate SEG-Y files utilizing binary search.
export const kum6D6ToSegy = async (
  location6d6: string,
  locationTarget: string,
  locationShotfile: string,
  filenameSegy: string,
  traceDuration: number,
  lon: number,
  lat: number,
  pauser: Pauser,
  onUpdate: (percentage: number, progress: string) => void) => {

  const file = await Kum6D6.open(location6d6)
  const segyFiles: SegyWriter[] = []
  try {
    const traceLength = traceDuration * file.header.sampleRate
    const channels = file.header.channels
    for (let i = 0; i < channels.length; ++i) {
      segyFiles[i] = await SegyWriter.create(path.join(locationTarget, filenameSegy + '-' + channels[i].name + '.segy'))
      await segyFiles[i].writeHeader(file.header, traceLength)
    }

    const shotFile = await readShotfile(locationShotfile)

    if (!checkShotFileIntergrity(shotFile, file.fileMetaDataStart, file.fileMetaDataEnd)) {
      for (let i = 0; i < segyFiles.length; ++i) {
        segyFiles[i].close()
      }
      file.close()
      throw "The ShotFile is corrupted."
    }

    let distances = []
    let adjustSigns = false

    // Calculate distances
    let minimum = -1
    for (let i = 0; i < shotFile.length; ++i) {
      let d = shotFile[i].distance
      if (d === null) {
        d = earthDistance(shotFile[i].lon, shotFile[i].lat, lon, lat)
        adjustSigns = true
      }
      if (minimum < 0 || distances[minimum] > d) minimum = i
      distances.push(d)
    }
    if (adjustSigns) {
      if (minimum > 0 && minimum + 1 < distances.length) {
        if (distances[minimum - 1] > distances[minimum + 1]) {
          minimum += 1
        }
      }
      for (let i = 0; i < minimum; ++i) {
        distances[i] *= -1
      }
    }
    // Convert data
    for (let i = 0; i < shotFile.length; ++i) {
      onUpdate(100 * i / shotFile.length, i + '/' + shotFile.length + ' shots processed')

      const shot = shotFile[i]
      await file.seek(shot.time)

      for (let j = 0; j < segyFiles.length; ++j) {
        await segyFiles[j].writeTraceHeader({
          numSamplesInThisTrace: traceLength,
          traceSequenceNumWithinFile: i + 1,
          traceSequenceNumWithinLine: i + 1,
          sampleIntervalForTrace: Math.round(1e6 / file.header.sampleRate),
          scalarCoordinatesSpecified: -100,
          // Conversion of 'decimal degrees' to 'seconds of arc'.
          // WGS84 coordinates are used here.
          groupCoordinateX: Math.round(lon * 60 * 60 * 100),
          groupCoordinateY: Math.round(lat * 60 * 60 * 100),
          srcCoordinateX: Math.round(shot.lon * 60 * 60 * 100),
          srcCoordinateY: Math.round(shot.lat * 60 * 60 * 100),
          coordinatesUnits: 'seconds-of-arc',
          yearDataRecorded: shot.time.year(),
          dayOfYear: shot.time.yday() + 1,
          hourOfDay: shot.time.hour(),
          minuteOfHour: shot.time.min(),
          secondOfMinute: shot.time.sec(),
          timeBasisCode: 'utc',
          shotpointNumber: shot.shotNr,
          distCenterSrcToCenterReceiver: distances[i],
        })
      }
      let sampleFrames = 0
      while (sampleFrames < traceLength) {
        if (!await file.read({
          onSamples: async samples => {
            sampleFrames += 1
            // write samples
            for (let i = 0; i < samples.length; ++i) {
              await segyFiles[i].writeSample(samples[i])
            }
          }/*,
          onTimeStamp: (s, us) => {
            //console.log([s, us])
          },
          onTemperature: t => {
            console.log(t + '°C')
          },
          onVoltageHumidity: (v, h) => {
            console.log([v + 'V',h + '%H'])
          },
          onLostSamples: (t, c) => {
            console.log('At: ', t, 'lost no: ', c)
          },
          onRecordingId: (t) => {
            console.log('Recording Id: ', t)
          },
          onRebootIndicator: (t, v) => {
            console.log('Rebootet at: ' + t + ' with: ' + v + 'V')
          }*/
        })) throw new Error('File too short')
        await pauser.whilePaused()
      }
      //console.log({ done: i })
    }
    onUpdate(100, shotFile.length + '/' + shotFile.length + ' shots processed')
  } finally {
    await file.close()
    for (let i = 0; i < segyFiles.length; ++i) {
      await segyFiles[i].close()
    }
  }
}

export default kum6D6ToSegy
