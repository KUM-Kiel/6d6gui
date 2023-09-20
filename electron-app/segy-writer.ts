const fs = require('fs')
const util = require('util')

const fsopen = util.promisify(fs.open)
const fsread = util.promisify(fs.read)
const fsclose = util.promisify(fs.close)
const fswrite = util.promisify(fs.write)

// sourcecode safe ebcdic converter
const ebcdic = (s: string) => new Uint8Array(Array.from(s).map(c => '\x20\xa0\xe2\xe4\xe0\xe1\xe3\xe5\xe7\xf1\xa2\x2e\x3c\x28\x2b\x7c\x26\xe9\xea\xeb\xe8\xed\xee\xef\xec\xdf\x21\x24\x2a\x29\x3b\xac\x2d\x2f\xc2\xc4\xc0\xc1\xc3\xc5\xc7\xd1\xa6\x2c\x25\x5f\x3e\x3f\xf8\xc9\xca\xcb\xc8\xcd\xce\xcf\xcc\x60\x3a\x23\x40\x27\x3d\x22\xd8\x61\x62\x63\x64\x65\x66\x67\x68\x69\xab\xbb\xf0\xfd\xfe\xb1\xb0\x6a\x6b\x6c\x6d\x6e\x6f\x70\x71\x72\xaa\xba\xe6\xb8\xc6\xa4\xb5\x7e\x73\x74\x75\x76\x77\x78\x79\x7a\xa1\xbf\xd0\xdd\xde\xae\x5e\xa3\xa5\xb7\xa9\xa7\xb6\xbc\xbd\xbe\x5b\x5d\xaf\xa8\xb4\xd7\x7b\x41\x42\x43\x44\x45\x46\x47\x48\x49\xad\xf4\xf6\xf2\xf3\xf5\x7d\x4a\x4b\x4c\x4d\x4e\x4f\x50\x51\x52\xb9\xfb\xfc\xf9\xfa\xff\x5c\xf7\x53\x54\x55\x56\x57\x58\x59\x5a\xb2\xd4\xd6\xd2\xd3\xd5\x30\x31\x32\x33\x34\x35\x36\x37\x38\x39\xb3\xdb\xdc\xd9\xda'.indexOf(c)).map(c => c < 0 ? 0x40 : c + 0x40))

import { Combined6d6Header } from './6d6-header-validation'

interface SegyBinaryHeader {
  jobIdentificationNumber?: number,
  lineNumber?: number,
  reelNumber?: number,
  numberOfDataTracesPerEnsemble?: number,
  numberOfAuxilaryTracesPerEnsemble?: number,
  sampleIntervalUs: number,
  sampleIntervalOrigRecordingUs?: number,
  numberSamplesPerDataTrace: number,
  numberSamplesPerDataTraceOrig?: number,
  dataSampleFormatCode: '4-byte-twos-complement',
  ensembleFold?: number,
  traceSortingCode?: 'unknown' | 'as-recorded' | null,
  verticalSumCode?: number,
  sweepFreqAtStart?: number,
  sweepFreqAtEnd?: number,
  sweepLength?: number,
  sweepTypeCode?: 'linear' | 'parabolic' | 'exponential' | 'other' | undefined | null,
  TraceNumberSweepChannel?: number,
  sweepTraceTaperLengthStart?: number,
  sweepTraceTaperLengthEnd?: number,
  taperType?: 'linear' | 'cosine-squared' | 'other' | null,
  correlatedDataTraces?: boolean | null,
  binaryGainRecovered?: boolean | null,
  amplitudeRecoveryMethod?: 'none' | 'spherical-divergence' | 'agc' | 'other' | null,
  measurementSystem?: 'meters' | 'feet' | null,
  impulseSignalPolarity?: 'increase-positive-number-on-trace' | 'increase-negative-number-on-trace',
  vibratoryPolarityCode?: number,
  extNumberDataTracesPerEnsemble?: number,
  extNumberAuxTracesPerEnsemble?: number,
  extNumberSamplesPerDataTrace?: number,
  extSampleIntervalIEEE?: number,
  extSampleIntervalOrigRecording?: number,
  extNumSamplesPerDataTraceOrigRec?: number,
  extEnsembleFold?: number,
  fixedLengthTraceFlag?: boolean,
  numTextFileHeaderRecords?: number, //0
  maxNumAdditionalTraceHeaders?: number,  //0
  timeBasisCode?: 'local' | 'gmt' | 'other' | 'utc' | 'gps',
  numTracesFileOrStream?: number,
  byteOffsetFirstTraceToStart?: number,
  numDataTrailerStanzaRecords?: number,
}

interface SegyTraceHeader {
  traceSequenceNumWithinLine: number,
  traceSequenceNumWithinFile: number,
  ogFieldRecordNum?: number,
  traceNumOgFieldRecord?: number,
  energySourcePointNumber?: number,
  ensembleNumber?: number,
  traceNumWithinEnsemble?: number,
  traceIdentificationCode?: number,
  numVerticalSummedTraces?: number,
  numHorizontalStackedTraces?: number,
  dataUse?: 'production' | 'test',
  distCenterSrcToCenterReceiver?: number,
  elevationReceiverGroup?: number,
  surfaceElevationSrcLocation?: number,
  srcDepthBelowSurface?: number,
  seismicDatumElevationReciever?: number,
  seismicDatumElevationSource?: number,
  waterColHeightSrcLocation?: number,
  waterColHeightReceiverLocation?: number,
  scalarElevationsDepthsSpec?: number,
  scalarCoordinatesSpecified: number,
  srcCoordinateX: number,
  srcCoordinateY: number,
  groupCoordinateX?: number,
  groupCoordinateY?: number,
  coordinatesUnits: 'length' | 'seconds-of-arc' | 'decimal-degrees' | 'degrees-minutes-seconds'
  wheatheringVelocity?: number,
  subwheatheringVelocity?: number,
  upholeTimeSrcInMs?: number,
  upholeTimeGroupInMs?: number,
  srcStaticCorrectionMs?: number,
  groupStaticCorrectionMs?: number,
  totalStaticAppliedMs?: number,
  lagTimeA?: number,
  lagTimeB?: number,
  delayRecordingTime?: number,
  muteTimeStartMs?: number,
  muteTimeEndMs?: number,
  numSamplesInThisTrace: number,
  sampleIntervalForTrace: number,
  gainTypeFieldInstruments?: 'fixed' | 'binary' | 'floating-point' | 'other',
  instrumentGainContantDb?: number,
  instrumentEarlyInitGainDb?: number,
  correlated?: boolean | null,
  sweepFreqStart?: number,
  sweepFreqEnd?: number,
  sweepLengthMs?: number,
  sweepType?: 'linear' | 'parabolic' | 'exponential' | 'other',
  sweepTraceTaperLengthStart?: number,
  sweepTraceTaperLengthEnd?: number,
  taperType?: 'linear' | 'cos2' | 'other',
  aliasFilterFreq?: number,
  aliasFilterSlope?: number,
  notchFilterFreq?: number,
  notchFilterSlope?: number,
  lowCutFreq?: number,
  highCutFreq?: number,
  lowCutSlope?: number,
  highCutSlope?: number,
  yearDataRecorded: number,
  dayOfYear: number,
  hourOfDay: number,
  minuteOfHour: number,
  secondOfMinute: number,
  timeBasisCode: 'local' | 'gmt' | 'other' | 'utc' | 'gps',
  traceWeightingFactor?: number,
  geophoneGroupNumRollSwitchOne?:  number,
  geophoneGroupNumtraceNumOne?: number,
  geophoneGroupNumLastTrace?: number,
  gapSize?: number,
  overTravelAssocTaper?: 'down-behind' | 'up-ahead' | 'unknown',
  xCoordinateEnsemble?: number,
  yCoordinateEnsemble?: number,
  inLineNumberPoststackData?: number,
  crossLineNumberPoststackData?: number,
  shotpointNumber: number,
  scalarForShotpointNumber?: number,
  traceValueMeasurementUnit?: 'other' | 'unknown' | 'pascal' | 'volts' | 'millivolts' | 'amperes' | 'meters' | 'm/s' | 'm/s2' | 'newton' | 'watt',
  transductionConstant?: number,
  transductionUnits?: 'other' | 'unknown' | 'pascal' | 'volts' | 'millivolts' | 'amperes' | 'meters' | 'm/s' | 'm/s2' | 'newton' | 'watt',
  deviceTraceIdentifier?: number,
  scalarAppliedToTimes?: number,
  sourceTypeOrientation?: 'unknown' | 'vibratory-vertical' | 'vibratory-cross-line' | 'vibratory-in-line' | 'impulsive-vertical' | 'impulsive-cross-line' | 'impulsive-in-line' | 'distributed-vertical' |
  'distributed-cross-line' | 'distributed-in-line',
  sourceEnergyDirectionVertical?: number,
  sourceEnergyDirectionCrossLine?: number,
  sourceEnergyDirectionInLine?: number,
  sourceMeasurementMantissa?: number,
  sourceMeasurementPowerTenExponent?: number,
  sourceMeasurementUnit?: number
}

export class SegyWriter  {
  fd: number | null
  buffer: Uint8Array
  bufferPosition: number
  //pointer: number = 0

  // Ab hier wird rumprobiert

  constructor(fd: number) {
    this.fd = fd
    this.buffer = new Uint8Array(1024 * 1024)
    this.bufferPosition = 0
    console.log(this.fd)
    console.log(typeof this.fd)
  }

  createTextHeader(lines: string[]) {
    let bytes: Uint8Array = new Uint8Array(3200)
    for (let l = 0; l < 40; ++l) {
      bytes.set(ebcdic((l < 10 ? 'C ' : 'C') + l), l * 80)
      for (let j = 3; j < 79; ++j) {
        bytes[l * 80 + j] = 0x40
      }
      bytes[l * 80 + 79] = 0x20
      if (l < lines.length) {
        bytes.set(ebcdic(lines[l]).slice(0, 75), l * 80 + 4)
      }
    }
    return bytes
  }

  createBinaryHeader(fields: SegyBinaryHeader) {
    let bytes: Uint8Array = new Uint8Array(400)
    let segyHeader: DataView = new DataView(bytes.buffer)

    segyHeader.setInt32(0, fields.jobIdentificationNumber || 1)
    segyHeader.setInt32(4, fields.lineNumber || 1)
    segyHeader.setInt32(8, fields.reelNumber || 1)
    segyHeader.setInt16(12, fields.numberOfDataTracesPerEnsemble || 1)
    segyHeader.setInt16(14, fields.numberOfAuxilaryTracesPerEnsemble || 0)
    segyHeader.setInt16(16, fields.sampleIntervalUs)
    segyHeader.setInt16(18, fields.sampleIntervalOrigRecordingUs || 0)
    segyHeader.setInt16(20, fields.numberSamplesPerDataTrace)
    segyHeader.setInt16(22, fields.numberSamplesPerDataTraceOrig || 0)
    segyHeader.setInt16(24, {
      '4-byte-twos-complement': 2
    }[fields.dataSampleFormatCode || '4-byte-twos-complement'])
    segyHeader.setInt16(26, fields.ensembleFold || 0)
    segyHeader.setInt16(28, {
      'unknown': 0,
      'as-recorded': 1
    }[fields.traceSortingCode || 'unknown'])
    segyHeader.setInt16(30, fields.verticalSumCode || 0)
    segyHeader.setInt16(32, fields.sweepFreqAtStart || 0)
    segyHeader.setInt16(34, fields.sweepFreqAtEnd || 0)
    segyHeader.setInt16(36, fields.sweepLength || 0)
    segyHeader.setInt16(38, {
      'unknown': 0,
      'linear': 1,
      'parabolic': 2,
      'exponential': 3,
      'other': 4
    }[fields.sweepTypeCode || 'unknown'])
    segyHeader.setInt16(40, fields.TraceNumberSweepChannel || 0)
    segyHeader.setInt16(42, fields.sweepTraceTaperLengthStart || 0)
    segyHeader.setInt16(44, fields.sweepTraceTaperLengthEnd || 0)
    segyHeader.setInt16(46, {
      'unknown': 0,
      'linear': 1,
      'cosine-squared': 2,
      'other': 3}[fields.taperType || 'unknown'])
    segyHeader.setInt16(48, fields.correlatedDataTraces ? 2 : 1 || 0)
    segyHeader.setInt16(50, fields.correlatedDataTraces ? 1 : 2 || 0)
    segyHeader.setInt16(52, {
      'unknown': 0,
      'none': 1,
      'spherical-divergence': 2,
      'agc': 3,
      'other': 4
    }[fields.amplitudeRecoveryMethod || 'unknown'])
    segyHeader.setInt16(54, {
      'unknown': 0,
      'meters': 1,
      'feet': 2
    }[fields.measurementSystem || 'unknown'])
    segyHeader.setInt16(56, {
      'unknown': 0,
      'increase-positive-number-on-trace': 1, 'increase-negative-number-on-trace': 2}[fields.impulseSignalPolarity || 'unknown'])
    segyHeader.setInt16(58, fields.vibratoryPolarityCode || 0)
    segyHeader.setInt32(60, fields.extNumberDataTracesPerEnsemble || 0)
    segyHeader.setInt32(64, fields.extNumberAuxTracesPerEnsemble || 0)
    segyHeader.setInt32(68, fields.extNumberSamplesPerDataTrace || 0)
    segyHeader.setFloat64(72, fields.extSampleIntervalIEEE || 0)
    segyHeader.setFloat64(80, fields.extSampleIntervalOrigRecording || 0)

    segyHeader.setInt32(88, fields.extNumSamplesPerDataTraceOrigRec || 0)
    segyHeader.setInt32(92, fields.extEnsembleFold || 0)
    segyHeader.setInt32(96, 0x01020304)

    segyHeader.setInt8(300, 2) //majorSEGYFormatRevisionNum
    segyHeader.setInt8(301, 0) //minorSEGYFormatRevisionNum
    segyHeader.setInt16(302, fields.fixedLengthTraceFlag === false ? 0 : 1)
    segyHeader.setInt16(304, fields.numTextFileHeaderRecords || 0)
    segyHeader.setInt32(306, fields.maxNumAdditionalTraceHeaders || 0)
    segyHeader.setInt16(310, {
      'unknown': 0,
      'local': 1,
      'gmt': 2,
      'other': 3,
      'utc': 4,
      'gps': 5}[fields.timeBasisCode ||'unknown'])
      segyHeader.setBigUint64(312, BigInt(fields.numTracesFileOrStream || 0))
      segyHeader.setBigUint64(320, BigInt(fields.byteOffsetFirstTraceToStart || 0))
      segyHeader.setInt32(328, fields.numDataTrailerStanzaRecords || 0)

    return bytes
  }

  createTraceHeader(fields: SegyTraceHeader) {
    let bytes: Uint8Array = new Uint8Array(240)
    let segyHeader: DataView = new DataView(bytes.buffer)

    segyHeader.setInt32(0, fields.traceSequenceNumWithinLine)
    segyHeader.setInt32(4, fields.traceSequenceNumWithinFile)
    segyHeader.setInt32(8, fields.ogFieldRecordNum || 0)
    segyHeader.setInt32(12, fields.traceNumOgFieldRecord || 0) // ?
    segyHeader.setInt32(16, fields.energySourcePointNumber || 0)
    segyHeader.setInt32(20, fields.ensembleNumber || 0)
    segyHeader.setInt32(24, fields.traceNumWithinEnsemble || 0)
    segyHeader.setInt16(28, fields.traceIdentificationCode || 0)
    // change default 0 to 1 for vert. & horz. :
    segyHeader.setInt16(30, fields.numVerticalSummedTraces || 1)
    segyHeader.setInt16(32, fields.numHorizontalStackedTraces || 1)
    segyHeader.setInt16(34, {
      'production': 1,
      'test' : 2
    }[fields.dataUse || 'production'])
    segyHeader.setInt32(36, fields.distCenterSrcToCenterReceiver || 0)
    segyHeader.setInt32(40, fields.elevationReceiverGroup || 0)
    segyHeader.setInt32(44, fields.surfaceElevationSrcLocation || 0)
    segyHeader.setInt32(48, fields.srcDepthBelowSurface || 0)
    segyHeader.setInt32(52, fields.seismicDatumElevationReciever || 0)
    segyHeader.setInt32(56, fields.seismicDatumElevationSource || 0)
    segyHeader.setInt32(60, fields.waterColHeightSrcLocation || 0)
    segyHeader.setInt32(64, fields.waterColHeightReceiverLocation || 0)
    segyHeader.setInt16(68, fields.scalarElevationsDepthsSpec || 0)
    segyHeader.setInt16(70, fields.scalarCoordinatesSpecified || 0)
    segyHeader.setInt32(72, fields.srcCoordinateX || 0)
    segyHeader.setInt32(76, fields.srcCoordinateY || 0)
    segyHeader.setInt32(80, fields.groupCoordinateX || 0)
    segyHeader.setInt32(84, fields.groupCoordinateY || 0)
    segyHeader.setInt16(88, {
      'length': 1,
      'seconds-of-arc': 2,
      'decimal-degrees': 3,
      'degrees-minutes-seconds': 4
    }[fields.coordinatesUnits || 'decimal-degrees'])
    segyHeader.setInt16(90, fields.wheatheringVelocity || 0)
    segyHeader.setInt16(92, fields.subwheatheringVelocity || 0)
    segyHeader.setInt16(94, fields.upholeTimeSrcInMs || 0)
    segyHeader.setInt16(96, fields.upholeTimeGroupInMs || 0)
    segyHeader.setInt16(98, fields.srcStaticCorrectionMs || 0)
    segyHeader.setInt16(100, fields.groupStaticCorrectionMs || 0)
    segyHeader.setInt16(102, fields.totalStaticAppliedMs || 0)
    segyHeader.setInt16(104, fields.lagTimeA || 0)
    segyHeader.setInt16(106, fields.lagTimeB || 0)
    segyHeader.setInt16(108, fields.delayRecordingTime || 0)
    segyHeader.setInt16(110, fields.muteTimeStartMs || 0)
    segyHeader.setInt16(112, fields.muteTimeEndMs || 0)
    segyHeader.setInt16(114, fields.numSamplesInThisTrace || 0)
    segyHeader.setInt16(116, fields.sampleIntervalForTrace || 0)
    segyHeader.setInt16(118, {
      'fixed': 1,
      'binary': 2,
      'floating-point': 3,
      'other': 4
    }[fields.gainTypeFieldInstruments || 'other'])
    segyHeader.setInt16(120, fields.instrumentGainContantDb || 0)
    segyHeader.setInt16(122, fields.instrumentEarlyInitGainDb || 0)
    segyHeader.setInt16(124, fields.correlated ? 2 : 1 || 0)
    segyHeader.setInt16(126, fields.sweepFreqStart || 0)
    segyHeader.setInt16(128, fields.sweepFreqEnd || 0)
    segyHeader.setInt16(130, fields.sweepLengthMs || 0)
    segyHeader.setInt16(132, {
      'linear': 1,
      'parabolic': 2,
      'exponential': 3,
      'other': 4
    }[fields.sweepType || 'other'])
    segyHeader.setInt16(134, fields.sweepTraceTaperLengthStart || 0)
    segyHeader.setInt16(136, fields.sweepTraceTaperLengthEnd || 0)
    segyHeader.setInt16(138, {
      'linear': 1,
      'cos2': 2,
      'other': 3
    }[fields.taperType || 'other'])
    segyHeader.setInt16(140, fields.aliasFilterFreq || 0)
    segyHeader.setInt16(142, fields.aliasFilterSlope || 0)
    segyHeader.setInt16(144, fields.notchFilterFreq || 0)
    segyHeader.setInt16(146, fields.notchFilterSlope || 0)
    segyHeader.setInt16(148, fields.lowCutFreq || 0)
    segyHeader.setInt16(150, fields.highCutFreq || 0)
    segyHeader.setInt16(152, fields.lowCutSlope || 0)
    segyHeader.setInt16(154, fields.highCutSlope || 0)
    segyHeader.setInt16(156, fields.yearDataRecorded || 0)
    segyHeader.setInt16(158, fields.dayOfYear || 0)
    segyHeader.setInt16(160, fields.hourOfDay || 0)
    segyHeader.setInt16(162, fields.minuteOfHour || 0)
    segyHeader.setInt16(164, fields.secondOfMinute || 0)
    segyHeader.setInt16(166, {
      'local': 1,
      'gmt': 2,
      'other': 3,
      'utc': 4,
      'gps': 5 }[fields.timeBasisCode || 'gmt'])
    segyHeader.setInt16(168, fields.traceWeightingFactor || 0)
    segyHeader.setInt16(170, fields.geophoneGroupNumRollSwitchOne || 0)
    segyHeader.setInt16(172, fields.geophoneGroupNumtraceNumOne || 0)
    segyHeader.setInt16(174, fields.geophoneGroupNumLastTrace || 0)
    segyHeader.setInt16(176, fields.gapSize || 0)
    segyHeader.setInt16(178, {
      'unknown': 0,
      'down-behind': 1,
      'up-ahead': 2
    }[fields.overTravelAssocTaper || 'unknown'])
    segyHeader.setInt32(180, fields.xCoordinateEnsemble || 0)
    segyHeader.setInt32(184, fields.yCoordinateEnsemble || 0)
    segyHeader.setInt32(188, fields.inLineNumberPoststackData || 0)
    segyHeader.setInt32(192, fields.crossLineNumberPoststackData || 0)
    segyHeader.setInt32(196, fields.shotpointNumber || 0)
    segyHeader.setInt16(200, fields.scalarForShotpointNumber || 0)
    segyHeader.setInt16(202, {
      'other': -1,
      'unknown': 0,
      'pascal': 1,
      'volts': 2,
      'millivolts': 3,
      'amperes': 4,
      'meters': 5,
      'm/s': 6,
      'm/s2': 7,
      'newton': 8,
      'watt': 9
    }[fields.traceValueMeasurementUnit || 'unknown'])
    segyHeader.setFloat64(204, fields.transductionConstant || 0)
    segyHeader.setInt16(210, {
      'other': -1,
      'unknown': 0,
      'pascal': 1,
      'volts': 2,
      'millivolts': 3,
      'amperes': 4,
      'meters': 5,
      'm/s': 6,
      'm/s2': 7,
      'newton': 8,
      'watt': 9
    }[fields.transductionUnits || 'unknown'])
    segyHeader.setInt16(212, fields.deviceTraceIdentifier || 0)
    segyHeader.setInt16(214, fields.scalarAppliedToTimes || 0)
    segyHeader.setInt16(216, {
      'unknown': 0,
      'vibratory-vertical': 1,
      'vibratory-cross-line': 2,
      'vibratory-in-line': 3,
      'impulsive-vertical': 4,
      'impulsive-cross-line': 5,
      'impulsive-in-line': 6,
      'distributed-vertical': 7,
      'distributed-cross-line': 8,
      'distributed-in-line': 9
    }[fields.sourceTypeOrientation || 'unknown'])
    segyHeader.setInt32(218, fields.sourceEnergyDirectionVertical || 0)
    segyHeader.setInt16(220, fields.sourceEnergyDirectionCrossLine || 0)
    segyHeader.setInt16(222, fields.sourceEnergyDirectionInLine || 0)
    segyHeader.setInt32(224, fields.sourceMeasurementMantissa || 0)
    segyHeader.setInt16(228, fields.sourceMeasurementPowerTenExponent || 0)
    segyHeader.setInt16(230, fields.sourceMeasurementUnit || 0)

    return bytes
  }

  async writeSample(data: number) {
    let bytes: Uint8Array = new Uint8Array(4)
    let view: DataView = new DataView(bytes.buffer)
    view.setInt32(0, data)
    return this.write(bytes)
  }

  static async create(filepath: string): Promise<SegyWriter> {
    let fd: number = await fsopen(filepath, 'w')
    return new SegyWriter(fd)
  }

  async write(bytes: Uint8Array): Promise<void> {
    if (this.fd === null) throw new Error('File already closed')
    for (let i = 0; i < bytes.length; ++i) {
      if (this.bufferPosition >= this.buffer.length) {
        await fswrite(this.fd, this.buffer)
        this.bufferPosition = 0
      }
      this.buffer[this.bufferPosition++] = bytes[i]
    }
  }

  async writeHeader(d6Header: Combined6d6Header, numberSamplesPerDataTrace: number): Promise<void> {
    await this.write(this.createTextHeader(['ja moin']))
    await this.write(this.createBinaryHeader({ //???
      numberSamplesPerDataTrace,
      sampleIntervalUs: Math.round(1000000 / d6Header.sampleRate),
      sampleIntervalOrigRecordingUs: Math.round(1000000 / d6Header.sampleRate),
      numberSamplesPerDataTraceOrig: numberSamplesPerDataTrace,
      dataSampleFormatCode: '4-byte-twos-complement',
      // ...
    }))
  }

  async writeTraceHeader(fields: SegyTraceHeader): Promise<void> {
    let traceHeader = this.createTraceHeader(fields)
    await this.write(traceHeader)
  }

  async close(): Promise<void> {
    if (this.bufferPosition > 0) {
      await fswrite(this.fd, this.buffer.slice(0, this.bufferPosition))
    }
    await fsclose(this.fd)
    this.fd = null
  }
}


const test = async () => {
  let writer: SegyWriter = await SegyWriter.create('test.segy')
  writer.createTextHeader(['No text for you'])

  console.log(writer)
}


if (require.main === module) {
  test().catch(e => {
    console.error(e)
    process.exit(1)
  })
}
