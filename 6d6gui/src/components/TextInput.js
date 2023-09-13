//import { useState } from 'react'

// Enhanced text inputs with different validity checks for dynamic specs.
const TextInput = ({
  value,
  valid = true,
  placeholder = '',
  disabled = false,
  changeFunction,
}) => {

  const handleInputChange = e => {
    changeFunction(e.target.value)
  }

  return (
    !disabled && (
      <div className={`input ${valid ? '' : 'error'}`}>
        <label>{placeholder}</label>
        <input
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          type='text'
        />
      </div>
    )
  )
}

export default TextInput
