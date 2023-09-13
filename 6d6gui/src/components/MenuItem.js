// Subcomponent of Menu to prevent repetition.
const MenuItem = ({ changeContent, menuItem }) => {
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
