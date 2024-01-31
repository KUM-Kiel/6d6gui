import { useState } from 'react'

// Validation for numeric & letter inputs.
export const alphaNumericCheck = (minChar: number, maxChar: number) => {
  const regExp = new RegExp(`^[A-Za-z0-9 ]{` + minChar + ',' + maxChar + `}$`)
  return (input: string) => regExp.test(input)
}

// Validation for solely numeric inputs.
export const numericCheck = (minValue: number, maxValue: number) => {
  const regExp = /^[0-9]+$/
  return (input: string) => {
    if (!regExp.test(input)) return false
    let v = BigInt(input)
    return minValue <= v && v <= maxValue
  }
}

// Validation for solely numeric inputs.
export const numericCheckFloat = (minValue: number, maxValue: number) => {
  const regExp = /^[+-]?[0-9]+(\.[0-9]+)?$/
  return (input: string) => {
    if (!regExp.test(input)) return false
    let v = Number(input)
    return minValue <= v && v <= maxValue
  }
}

// Validation for the MSeed output template.
// Including the '%S' is mandatory for MSeed, because the station-code is
// mandatory as well.
export const outputTemplateCheck = () => {
  const regExp = /^[A-Za-z0-9-_.%/]+$/
  const regExpStation = new RegExp(`%S`)
  return (input: string) => regExp.test(input) && regExpStation.test(input)
}

// Validation for filename inputs.
export const filenameCheck = (minChar: number, maxChar: number) => {
  const regExp = new RegExp(`^[A-Za-z0-9-_.]{${minChar},${maxChar}}$`)
  return (input: string) => regExp.test(input)
}

export interface ValidatedValue<T> {
  value: T,
  valid: boolean
}

// Changed 't' to 'T' @ [...,(value: t) => void]
export const useValidatedState = <T,>(initialValue: T, validator: (value: T) => boolean): [ValidatedValue<T>, (value: T) => void] => {
  const [v, s] = useState({
    value: initialValue,
    valid: validator(initialValue)
  })
  return [v, (value: T) => s({value, valid: validator(value)})]
}

export default useValidatedState
