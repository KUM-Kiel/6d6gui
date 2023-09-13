import { useState } from 'react'

// Validation for numeric & letter inputs.
export const alphaNumericCheck = (minChar, maxChar) => {
  const regExp = new RegExp(`^[A-Za-z0-9 ]{` + minChar + ',' + maxChar + `}$`)
  return input => regExp.test(input)
}

// Validation for solely numeric inputs.
export const numericCheck = (minChar, maxChar) => {
  const regExp = new RegExp(`^[0-9]{` + minChar + ',' + maxChar + `}$`)
  return input => regExp.test(input)
}

// Validation for filename inputs.
export const filenameCheck = (minChar, maxChar) => {
  const regExp = new RegExp(`^[A-Za-z0-9-_.$§^]{${minChar},${maxChar}}$`)
  return input => regExp.test(input)
}

export const useValidatedState = (initialValue, validator) => {
  const [v, s] = useState({
    value: initialValue,
    valid: validator(initialValue)
  })
  return [v, value => s({ value, valid: validator(value) })]
}

export default useValidatedState
