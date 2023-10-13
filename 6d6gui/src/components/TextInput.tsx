// Enhanced text inputs with different validity checks for dynamic specs.
import React from "react"

type TextInputProps = {
  value: number,
  valid: boolean,
  placeholder: string,
/*   disabled: boolean,
 */  changeFunction: Function,
}

const TextInput = ({
  value,
  valid = true,
  placeholder = '',
  /* disabled = false, */
  changeFunction,
}: TextInputProps	) => {

  const handleInputChange = e => {
    changeFunction(e.target.value)
  }

  return (
/*     !disabled &&  */(
      <div className={`input ${valid ? '' : 'error'}`}>
        <label>{placeholder}</label>
        <input
          value={value}
          onChange={handleInputChange}
/*           disabled={disabled}
 */          type='text'
        />
      </div>
    )
  )
}

export default TextInput
