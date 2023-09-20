import Kum6D6 from './kum-6d6'
import { readShotFile, readShotFileSend, Shot } from './shot-file-parser'
import { limit512, str, memoryCompare, readBcdTime, kum6D6HeaderRead, malformedMessage } from './6d6-header'
import { MetaFrameCallbacks, parseMetaFrame } from './6d6-meta-data-converter'
import TaiDate from './tai'
import { SegyWriter } from './segy-writer'

import path from 'path'
import fs from 'fs/promises'

const rnd = () => Math.random() - Math.random() + Math.random() - Math.random()

// generate seg-y files
const kum6D6ToSegy = async (location6d6: string, locationTarget: string, locationShotFile: string, fileNameSegy: string) => {
  const file = await Kum6D6.open(location6d6)
  // tracelength: time * sampleRate, settable by user
  // tracelength "30" shall be set dynamically by the user in the future.
  const traceLength = 30 * file.header.sampleRate
  const channels = file.header.channels
  //console.log('Channels found are: ', channels)
  const segyFiles: SegyWriter[] = []
  /*   const destFile = fswrite(locationTarget, ' ', 0) // ??? */
  await fs.mkdir('SegyFiles', { recursive: true })
  for (let i = 0; i < channels.length; ++i) {
    segyFiles[i] = await SegyWriter.create(path.join('SegyFiles', fileNameSegy + '-' + channels[i].name + '.segy'))
    await segyFiles[i].writeHeader(file.header, traceLength)
  }
  //console.log('metaDataStart: ', file.fileMetaDataStart)
  //console.log('metaDataEnd: ', file.fileMetaDataEnd)
  //console.log('skew: ', file.header.skew)

  // shot in shotfile - parser, read shots per line
  // compare timestamp to 6d6file
  // every shotfile-line shall be a trace from .6d6

  // write file headers
  const shotFile = await readShotFile(locationShotFile)
  for (let i = 0; i < shotFile.length; ++i) {
    // console.log({start:i})
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
   //  console.log({seek:await file.seek(shot.time)})
    // write trace headers
    let sampleFrames = 0
   // console.log({write:i})
    while (sampleFrames < traceLength) {
      if (!await file.read({
        onSamples: async samples => {
          sampleFrames += 1
          // write samples
          for (let i = 0; i < samples.length; ++i) {
            await segyFiles[i].writeSample(samples[i])
          }
        },
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
        }
      })) throw new Error('File too short')
      // write fake samples
      /*sampleFrames += 1
       for (let i = 0; i < segyFiles.length; ++i) {
        await segyFiles[i].writeSample(Math.round(1e6 * rnd()))
      }*/
    }
    console.log({done:i})
  }
  for (let i = 0; i < segyFiles.length; ++i) {
    await segyFiles[i].close()
  }
}


const createSegyFile = async (segyData: number, destinationTarget: string): Promise<void> => {

}

async function test() {
  await kum6D6ToSegy('../obs114.6d6', 'segy', '../shotfile.p01a.dat', 'testSegyFile')
}

test().catch(e => {
  console.error(e)
})
