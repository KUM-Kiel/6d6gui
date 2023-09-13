import MenuItem from './MenuItem'
import { setTheme } from './Themes'
import { useEffect, useState } from 'react'

// Top menu to choose between the different 6D6 suites (and a theme toggle).
const Menu = ({ menu, changeContent, directories, setAppDarkMode }) => {
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
      <MenuItem
        key={menu[0].id}
        menuItem={menu[0]}
        changeContent={changeContent}
      />
      <MenuItem
        key={menu[1].id}
        menuItem={menu[1]}
        changeContent={changeContent}
      />
      <MenuItem
        key={menu[2].id}
        menuItem={menu[2]}
        changeContent={changeContent}
      />

      {directories.length !== 0 && (
        <MenuItem
          key={menu[3].id}
          menuItem={menu[3]}
          changeContent={changeContent}
        />
      )}
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

export default Menu
