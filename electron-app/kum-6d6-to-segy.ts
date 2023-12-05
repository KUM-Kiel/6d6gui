import { readShotFile } from './shot-file-parser'
import { SegyWriter } from './segy-writer'
import Kum6D6 from './kum-6d6'

import path from 'path'
import { Pauser } from './pauser'

// For testing purposes.
const rnd = () => Math.random() - Math.random() + Math.random() - Math.random()

// generate seg-y files
export const kum6D6ToSegy = async (location6d6: string, locationTarget: string, locationShotFile: string, filenameSegy: string, traceDuration: number,pauser: Pauser,   onUpdate: (percentage: number, progress: string) => void) => {
  const file = await Kum6D6.open(location6d6)
  const segyFiles: SegyWriter[] = []

  try {
    const traceLength = traceDuration * file.header.sampleRate
    const channels = file.header.channels

    for (let i = 0; i < channels.length; ++i) {
      segyFiles[i] = await SegyWriter.create(path.join(locationTarget, filenameSegy + '-' + channels[i].name + '.segy'))
      await segyFiles[i].writeHeader(file.header, traceLength)
    }
    // shot in shotfile - parser, read shots per line
    // compare timestamp to 6d6file
    // every shotfile-line shall be a trace from .6d6

    // write file headers
    const shotFile = await readShotFile(locationShotFile)
    for (let i = 0; i < shotFile.length; ++i) {
      onUpdate(100 * i / shotFile.length, i + '/' + shotFile.length + ' shots processed')
      // relocate 'write to trace' because of read information from meta-data?
      // such as: timestamp, temperature, voltage humidity?
      const shot = shotFile[i]
      for (let j = 0; j < segyFiles.length; ++j) {
        await segyFiles[j].writeTraceHeader({
          numSamplesInThisTrace: traceLength,
          traceSequenceNumWithinFile: i + 1,
          traceSequenceNumWithinLine: i + 1,
          sampleIntervalForTrace: Math.round(1e6 / file.header.sampleRate),
          scalarCoordinatesSpecified: -100,
          // Conversion of 'decimal degrees' to 'seconds of arc'.
          // WGS84 coordinates are used here.
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
      console.log({done:i})

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
