// Subcomponent of Menu to prevent repetition.
import React from "react"

type MenuItemProps = {
  id: number,
  title: string,
  active: boolean,
  changeContent: (id: number) => void
}

// Each Button of the menu column is an instance of this component.
const MenuItem = ({ id, title, active, changeContent }: MenuItemProps) => {
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
