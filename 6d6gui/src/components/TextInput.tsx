// Enhanced text inputs with different validity checks for dynamic specs.
// See '../validation.ts' for more details.
import React, { ChangeEventHandler } from "react"

type TextInputProps = {
  value: string,
  valid: boolean,
  placeholder: string,
  changeFunction: (value: string) => void,
}

const TextInput = ({
  value,
  valid = true,
  placeholder = '',
  changeFunction,
}: TextInputProps) => {

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = e => {
    changeFunction(e.target.value)
  }

  return (
    <div className={`input ${valid ? '' : 'error'}`}>
      <label>{placeholder}</label>
      <input
        value={value}
        onChange={handleInputChange}
        type='text'
      />
    </div>
  )
}

export default TextInput
