// Subcomponent of Menu to prevent repetition.
import React from "react"

const MenuItem = ({ id, title, active, changeContent }: {id: number, title: string, active: boolean, changeContent: Function }) => {
  const addOn = active ? 'active' : ''
  const className = 'menu-item ' + addOn
  return (
    <button
      className={className}
      onClick={() => {
        changeContent(id)
      }}
    >
      {title}
    </button>
  )
}

export default MenuItem
