// Header of the Application.
import React from "react"

const version = '0.0.2'

// Header Component - might be a complete  overkill.
const Header = ({ title }: {title:string}) => {
  return (
    <div >
      <p className={'header'} >{title} - Version {version}</p>
    </div>
  )
}

Header.defaultProps = {
  title: '6D6Gui',
}

export default Header
