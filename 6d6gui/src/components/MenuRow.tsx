import { Device } from "../../../electron-app/6d6watcher"
import { useEffect, useState } from 'react'
import { MenuElement } from "../App"
import { setTheme } from './Themes'
import MenuItem from './MenuItem'
import React from "react"

type MenuColumnProps = {
  menu: MenuElement[],
  changeContent: (id: number) => void,
  directories: Device[],
  setAppDarkMode: (value: boolean) => void,
  systemOS: string,
  activeMenuItem: number,
}

// Top menu to choose between the different 6D6 suites (and a theme toggle).
const MenuRow = ({ menu, changeContent, directories, setAppDarkMode, systemOS, activeMenuItem }: MenuColumnProps) => {
  const [togClass, setTogClass] = useState('light')
  const [darkMode, setDarkMode] = useState(true)
  let theme = localStorage.getItem('theme')

  // Toggles between the dark and the bright theme.
  const toggleTheme = () => {
    if (localStorage.getItem('theme') === 'theme-dark') {
      setTheme('theme-light')
      setTogClass('light')
      setDarkMode(false)
      setAppDarkMode(false)
    } else {
      setTheme('theme-dark')
      setTogClass('dark')
      setDarkMode(true)
      setAppDarkMode(true)
    }
  }
  // Picking up the user settings to set theme.
  useEffect(() => {
    if (localStorage.getItem('theme') === 'theme-dark') {
      setTogClass('dark')
    } else if (localStorage.getItem('theme') === 'theme-light') {
      setTogClass('light')
    }
  }, [theme])

  return (
    <div className="menu-style">
      {
        menu
        .filter(item => item.show(systemOS, directories.length))
        .map((item, id) => <MenuItem
          key={id}
          id={id}
          title={item.title}
          active={activeMenuItem === id}
          changeContent={changeContent}/>)
      }

      {/* Theme toggler. */}
      <label className="toggle" htmlFor='dark-mode-toggle'>
        <input
          className="toggle-input"
          type='checkbox'
          id='dark-mode-toggle'
          checked={darkMode}
          onChange={() => toggleTheme()}
        />
        <div className="toggle-fill">
          <div className="toggle-text">{`${togClass} Mode`}</div>
        </div>
      </label>
    </div>
  )
}

export default MenuRow
