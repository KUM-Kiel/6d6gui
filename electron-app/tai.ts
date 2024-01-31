const leapseconds = [
  -867887990000000n,
  -851990389000000n,
  -820454388000000n,
  -788918387000000n,
  -757382386000000n,
  -725759985000000n,
  -694223984000000n,
  -662687983000000n,
  -631151982000000n,
  -583891181000000n,
  -552355180000000n,
  -520819179000000n,
  -457660778000000n,
  -378691177000000n,
  -315532776000000n,
  -283996775000000n,
  -236735974000000n,
  -205199973000000n,
  -173663972000000n,
  -126230371000000n,
  -78969570000000n,
  -31535969000000n,
  189388832000000n,
  284083233000000n,
  394416034000000n,
  489024035000000n,
  536544036000000n,
]

const lastValid = 741484837000000n
const nextUpdate = 728524837000000n

const divmod = (a : bigint, b : bigint): [bigint, bigint] => {
  let d = a / b
  let m = a % b
  if (m < 0n) {
    m += b
    d -= 1n
  }
  return [d, m]
}

const leapsecAdd = (t: bigint, hit: boolean) => {
  t += 10000000n
  for (let i = 0; i < leapseconds.length; ++i) {
    if (t < leapseconds[i]) break
    if (!hit || (t >= leapseconds[i] + 1000000n)) t += 1000000n
  }
  return t
}

const leapsecSub = (t: bigint): [bigint, boolean] => {
  let s = 10000000n
  for (let i = 0; i < leapseconds.length; ++i) {
    if (t < leapseconds[i]) break
    s += 1000000n
    if (t < leapseconds[i] + 1000000n) {
      return [t - s, true]
    }
  }
  return [t - s, false]
}

const pad = (n: number, l = 2) => {
  let s = String(n)
  while (s.length < l) s = '0' + s
  return s
}

interface TaiComponents {
  year: number, month: number, day: number,
  hour: number, min: number, sec: number, usec: number,
  yday: number, wday: number,
}

const taiTime = (year: number, month: number, day: number, hour: number, min: number, sec: number, usec: number): bigint => {
  let y = BigInt(year) - 2000n
  let m = BigInt(month) - 3n
  let d = BigInt(day) + 59n

  let t = divmod(m, 12n)[0]
  m -= 12n * t
  y += t

  d += (m * 153n + 2n) / 5n
  d += y * 365n + divmod(y, 4n)[0] - divmod(y, 100n)[0] + divmod(y, 400n)[0]

  return leapsecAdd(BigInt(usec) + 1000000n * (BigInt(sec) + 60n * (BigInt(min) + 60n * (BigInt(hour) + d * 24n))), sec === 60)
}

const taiDate = (t: bigint): TaiComponents => {
  let leap: boolean
  ;[t, leap] = leapsecSub(t)
  let d = divmod(t, 1000000n)
  const usec = Number(d[1])
  d = divmod(d[0], 60n)
  const sec = Number(d[1]) + Number(leap)
  d = divmod(d[0], 60n)
  const min = Number(d[1])
  d = divmod(d[0], 24n)
  const hour = Number(d[1])
  t = d[0]

  let y: bigint
  ;[y, t] = divmod(t + 730425n, 146097n)
  const wday = Number((t + 3n) % 7n)

  y *= 4n
  if (t === 146096n) {
    y += 3n
    t = 36524n
  } else {
    y += t / 36524n
    t %= 36524n
  }
  y *= 25n
  y += t / 1461n
  t %= 1461n
  y *= 4n

  let yday = Number(t < 306)
  if (t === 1460n) {
    y += 3n
    t = 365n
  } else {
    y += t / 365n
    t %= 365n
  }
  yday += Number(t)

  t *= 10n
  let m: bigint
  ;[m, t] = divmod(t + 5n, 306n)
  t /= 10n
  if (m >= 10n) {
    yday -= 306
    y += 1n
    m -= 10n
  } else {
    yday += 59
    m += 2n
  }

  const year = Number(y)
  const month = Number(m + 1n)
  const day = Number(t + 1n)

  return {
    year, month, day,
    hour, min, sec, usec,
    yday, wday
  }
}

const parseDate = (s: string): bigint => {
  let m = s.match(/^[ ]*([0-9]+)-([0-9]+)-([0-9]+)[ ]*[T ][ ]*([0-9]+):([0-9]+)(:([0-9]+)(\.([0-9]{1,6}))?)?[ ]*(Z|UTC)?[ ]*$/)
  if (m) {
    let year = parseInt(m[1], 10)
    let month = parseInt(m[2], 10)
    let day = parseInt(m[3], 10)
    let hour = parseInt(m[4], 10)
    let min = parseInt(m[5], 10)
    let sec = 0
    if (m[6]) sec = parseInt(m[7], 10)
    let usec = 0
    if (m[8]) usec = parseInt(m[9], 10) * Math.pow(10, 6 - m[9].length)
    return taiTime(year, month, day, hour, min, sec, usec)
  } else {
    throw new Error('Invalid date')
  }
}

export class TaiDate {
  t: bigint
  d: TaiComponents | null
  constructor()
  constructor(t: bigint)
  constructor(s: string)
  constructor(year: number, month?: number, day?: number, hour?: number, min?: number, sec?: number, usec?: number)
  constructor(year?: number | bigint | string, month = 1, day = 1, hour = 0, min = 0, sec = 0, usec = 0) {
    this.d = null
    if (typeof year === 'undefined') {
      let d = new Date()
      this.t = taiTime(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(),
        d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds() * 1000)
    } else if (typeof year === 'bigint') {
      this.t = year
    } else if (typeof year === 'string') {
      this.t = parseDate(year)
    } else {
      this.t = taiTime(year, month, day, hour, min, sec, usec)
    }
  }
  leapsecsValid() {
    return this.t < lastValid
  }
  //  Use this function to indicate update-need.
  leapsecsNeedUpdate() {
    return this.t > nextUpdate
  }
  utcDifference(): number {
    let d = 10
    for (let i = 0; i < leapseconds.length; ++i) {
      if (this.t < leapseconds[i]) break
      d += 1
    }
    return d
  }
  year() {
    if (this.d === null) this.d = taiDate(this.t)
    return this.d.year
  }
  month() {
    if (this.d === null) this.d = taiDate(this.t)
    return this.d.month
  }
  day() {
    if (this.d === null) this.d = taiDate(this.t)
    return this.d.day
  }
  hour() {
    if (this.d === null) this.d = taiDate(this.t)
    return this.d.hour
  }
  min() {
    if (this.d === null) this.d = taiDate(this.t)
    return this.d.min
  }
  sec() {
    if (this.d === null) this.d = taiDate(this.t)
    return this.d.sec
  }
  usec() {
    if (this.d === null) this.d = taiDate(this.t)
    return this.d.usec
  }
  yday() {
    if (this.d === null) this.d = taiDate(this.t)
    return this.d.yday
  }
  wday() {
    if (this.d === null) this.d = taiDate(this.t)
    return this.d.wday
  }
  valueOf() {
    return this.t
  }
  toISOString() {
    if (this.d === null) this.d = taiDate(this.t)
    return this.d.year + '-' + pad(this.d.month) + '-' + pad(this.d.day) + 'T' + pad(this.d.hour) + ':' + pad(this.d.min) + ':' + pad(this.d.sec) + '.' + pad(this.d.usec, 6) + 'Z'
  }
  toString() {
    return this.toISOString()
  }
}

export default TaiDate
