import TaiDate from './tai'
import {readBcdTime} from './6d6-header'

export interface MetaFrameCallbacks {
  onTimeStamp?: (seconds: number, microseconds: number) => void | Promise<void>,
  onVoltageHumidity?: (voltage: number, humidity: number) => void | Promise<void>,
  onTemperature?: (temperature: number) => void | Promise<void>,
  onLostSamples?: (time: TaiDate | null, count: number) => void | Promise<void>,
  onRecordingId?: (startTime: TaiDate | null) => void | Promise<void>,
  onRebootIndicator?: (time: TaiDate | null, voltage: number) => void | Promise<void>,
  onLogEntry?: (time: TaiDate | null, code: number, data: number) => void | Promise<void>,
  onSeismometerTemperatureHumidity?: (temperature: number, huimidity: number) => void | Promise<void>,
  //callback gibt die Werte in g aus (/16384)
  onSeismometerCaseAccelerometer?: (x: number, y: number, z: number) => void | Promise<void>,
  //callback gibt die Werte in g aus (/16384)
  onSeismometerStageAccelerometer?: (x: number, y: number, z: number) => void | Promise<void>,
  //callback gibt die Werte in Volt aus (/1000)
  onSeismometerPositionVoltages?: (x: number, y: number, z: number) => void | Promise<void>,
  onSeismometerEvent?: (status: number | string) => void | Promise<void>,
}

export const parseMetaFrame = async (data: DataView, callbacks: MetaFrameCallbacks): Promise<void> => {
  let frameId = data.getInt32(0)
  if (frameId === 1) {
    // Timestamp
    if (callbacks.onTimeStamp)
      await callbacks.onTimeStamp(data.getUint32(4), data.getUint32(8))
  } else if (frameId === 3) {
    // VoltageHumidity
    if (callbacks.onVoltageHumidity)
      await callbacks.onVoltageHumidity(data.getUint16(4) / 100, data.getUint16(6))
  } else if (frameId === 5) {
    // Temperature
    if (callbacks.onTemperature)
      await callbacks.onTemperature(data.getInt16(4) / 100)
  } else if (frameId === 7) {
    // Lost Samples Indicator
    if (callbacks.onLostSamples)
      await callbacks.onLostSamples(readBcdTime(data , 4), data.getUint32(10))
  } else if (frameId === 9) {
    // Recording ID
    if (callbacks.onRecordingId)
      await callbacks.onRecordingId(readBcdTime(data, 4))
  } else if (frameId === 11) {
    // Reboot Indicator
    if (callbacks.onRebootIndicator)
      await callbacks.onRebootIndicator(readBcdTime(data, 4), data.getUint16(10))
  }  else if (frameId === 15) {
    // Logger Entry
    if (callbacks.onLogEntry)
      await callbacks.onLogEntry(readBcdTime(data, 4), data.getUint16(10), data.getInt32(12))
  }  else if (frameId === 101) {
    // Seismometer Temperature & Humidity
    if (callbacks.onSeismometerTemperatureHumidity)
      await callbacks.onSeismometerTemperatureHumidity(data.getInt16(4), data.getUint16(6))
  }  else if (frameId === 103) {
    // Seismometer Case Accelerometer
    if (callbacks.onSeismometerCaseAccelerometer)
      await callbacks.onSeismometerCaseAccelerometer(data.getInt16(4),data.getInt16(6), data.getInt16(8))
  }  else if (frameId === 105) {
    // Seismometer Stage Accelerometer
    if (callbacks.onSeismometerStageAccelerometer)
      await callbacks.onSeismometerStageAccelerometer(data.getInt16(4),data.getInt16(6), data.getInt16(8))
  }  else if (frameId === 107) {
    // Seismometer Position Values
    if (callbacks.onSeismometerPositionVoltages)
      await callbacks.onSeismometerPositionVoltages(data.getInt16(4),data.getInt16(6), data.getInt16(8))
  }   else if (frameId === 109) {
    // Seismometer Event - For event types see 6D7-Docs @ Id: 109
    if (callbacks.onSeismometerEvent)
      await callbacks.onSeismometerEvent(data.getUint16(4))
  }



}

export default parseMetaFrame
