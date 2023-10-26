import { useState } from 'react'

// Validation for numeric & letter inputs.
export const alphaNumericCheck = (minChar: number, maxChar: number) => {
  const regExp = new RegExp(`^[A-Za-z0-9 ]{` + minChar + ',' + maxChar + `}$`)
  return (input: string) => regExp.test(input)
}

// Validation for solely numeric inputs.
export const numericCheck = (minChar: number, maxChar: number) => {
  const regExp = new RegExp(`^[0-9]{` + minChar + ',' + maxChar + `}$`)
  return (input: string) => regExp.test(input)
}

// Validation for filename inputs.
export const filenameCheck = (minChar: number, maxChar: number) => {
  const regExp = new RegExp(`^[A-Za-z0-9-_.$§^]{${minChar},${maxChar}}$`)
  return (input: string) => regExp.test(input)
}

export interface ValidatedValue<T> {
  value: T,
  valid: boolean
}

// aus 't' ein 'T' gemacht @ [...,(value: t) => void]
export const useValidatedState = <T,>(initialValue: T, validator: (value: T) => boolean): [ValidatedValue<T>, (value: T) => void] => {
  const [v, s] = useState({
    value: initialValue,
    valid: validator(initialValue)
  })
  return [v, (value: T) => s({value, valid: validator(value)})]
}

export default useValidatedState
