// Subcomponent of Menu to prevent repetition.
import { MenuElement } from "../App"
import React from "react"

const MenuItem = ({ changeContent, menuItem }: {changeContent: Function, menuItem: MenuElement }) => {
  const addOn = menuItem.active ? 'active' : ''
  const className = 'menu-item ' + addOn
  return (
    <button
      className={className}
      onClick={() => {
        changeContent(menuItem.id)
      }}
    >
      {menuItem.title}
    </button>
  )
}

export default MenuItem
