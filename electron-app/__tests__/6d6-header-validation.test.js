import combine6d6Headers, { Combined6d6Header } from './6d6-header-validation'

export const check6d6HeaderMerge = () => {

  const firstHeader = {
    version: 1,
    time: new TaiDate(539321665000000n),
    syncType: 'sync',
    syncTime: new TaiDate(539321328000000n),
    skew: 81,
    address: 2,
    sampleRate: 250,
    writtenSamples: 0n,
    lostSamples: 0,
    bitDepth: 32,
    recorderID: '61607074',
    rtcID: '16047',
    latitude: '          ',
    longitude: '           ',
    channels: [{ name: 'H', gain: 1 },
    { name: 'X', gain: 1 },
    { name: 'Y', gain: 1 },
    { name: 'Z', gain: 1 }],
    comment: 'Project ewars2017/terise, profile 20170100, station st109/tr09, network KP\n'
  }
  const secondHeader = {
    version: 1,
    time: new TaiDate(539919206000000n),
    syncType: 'skew',
    syncTime: new TaiDate(539919254000000n),
    skew: 77263,
    address: 4688434,
    sampleRate: 250,
    writtenSamples: 149384215n,
    lostSamples: 0,
    bitDepth: 32,
    recorderID: '61607074',
    rtcID: '16047',
    latitude: '          ',
    longitude: '           ',
    channels: [{ name: 'H', gain: 1 },
    { name: 'X', gain: 1 },
    { name: 'Y', gain: 1 },
    { name: 'Z', gain: 1 }],
    comment: 'Project ewars2017/terise, profile 20170100, station st109/tr09, network KP\n'
  }
  const combinedHeader = {}

test('Validation of Header-Merging', () => {
  expect(combine6d6Headers(firstHeader, secondHeader).toEqual(combinedHeader))
})

}
