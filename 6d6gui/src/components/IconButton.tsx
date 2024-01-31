import { Action } from "../../../electron-app/spawnProcess"
import React from "react"

// SVG values for the pictograms of the different values and actions.
const paths = {
  cancel: 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.59-13L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z',
  pause: 'M9 16h2V8H9v8zm3-14C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-4h2V8h-2v8z',
  continue: 'M10 16.5l6-4.5-6-4.5zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  confirm: 'M12 0c6.623 0 12 5.377 12 12s-5.377 12-12 12-12-5.377-12-12 5.377-12 12-12zm0 1c6.071 0 11 4.929 11 11s-4.929 11-11 11-11-4.929-11-11 4.929-11 11-11zm7 7.457l-9.005 9.565-4.995-5.865.761-.649 4.271 5.016 8.24-8.752.728.685z'
}

// Props for the IconButton.
type IconButtonProps = {
  activateAction: (taskID: string, action: string) => void,
  taskId: string,
  action: Action,
  darkMode: boolean
}

// A Button shown by an icon executing a corresponding action.
const IconButton = ({ activateAction, taskId, action, darkMode }: IconButtonProps) => {
  return (
    <svg className="icon" height='24px' viewBox='0 0 24 24' width='24px' fillRule="evenodd" clipRule="evenodd" onClick={() =>
      activateAction(taskId, action)}>
      <path fill={darkMode ? '#79B1F6' : '#0a4998'} d={paths[action]} />
    </svg>
  )
}

export default IconButton
