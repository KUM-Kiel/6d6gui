import { Channel } from "../../../electron-app/6d6-header"
import React from "react"

// Subcomponent of D6Info to prevent repetition.
const D6RecorderChannels = ({ channels }: {channels: Channel[]}) => {
  if (channels === undefined) {
    return (<div>Channels: n.a.</div>)
  } else {
    return (<div>
      {channels.map((obj) => (
      <div className="monospace" key={obj.name}>Name: {obj.name}, Gain: {obj.gain}</div>
    ))}</div>)
  }
}
export default D6RecorderChannels
