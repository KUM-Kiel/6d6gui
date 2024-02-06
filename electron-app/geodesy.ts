// This File contains functions to handle different coordinate representations.

export const secondsOfArcToRadians = (secondsOfArc: number): number => {
  return secondsOfArc * Math.PI / (180 * 60 * 60)
}

export const radiansToSecondsOfArc = (radians: number): number => {
  return radians / Math.PI * (180 * 60 * 60)
}

export const degreeToRadians = (degree: number) => {
  return degree * Math.PI / 180
}

export const radiansToDegree = (radians: number) => {
  return radians / Math.PI * 180
}

// Lon = x | Lat = y
// Be aware to have the values in radians! (BOGENMAß)
export const distanceSphere = (lon1: number, lat1: number, lon2: number, lat2: number, radius: number): number => {
  return Math.acos((Math.sin(lat1) * Math.sin(lat2)) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)) * radius
}

// Value in meters.
// Source: WGS84 - earths mean-radius
export const EARTH_RADIUS = 6371008.8

// Lat/Lon in degrees!
export const earthDistance = (lon1: number, lat1: number, lon2: number, lat2: number): number => distanceSphere(
  degreeToRadians(lon1),
  degreeToRadians(lat1),
  degreeToRadians(lon2),
  degreeToRadians(lat2),
  EARTH_RADIUS
)
