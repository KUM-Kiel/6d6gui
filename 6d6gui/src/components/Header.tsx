// Header of the Application.
import React from "react"

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
