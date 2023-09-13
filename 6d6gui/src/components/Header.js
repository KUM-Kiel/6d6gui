// Header of the Application.
const Header = ({ title }) => {
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
