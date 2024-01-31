// Header of the Application.
import React from "react"

// Header Component - might be a complete  overkill.
const Header = ({ title }: {title:string}) => {
  return (
    <div >
      <p className={'header'} >{title}</p>
    </div>
  )
}

Header.defaultProps = {
  title: '6D6Gui',
}

export default Header
