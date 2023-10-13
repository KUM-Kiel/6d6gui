import { Channel } from "../../../electron-app/6d6-header"
import React from "react"

type D6RecorderChannelsProps = {
  channels: Channel[]
}

// Subcomponent of D6Info to prevent repetition.
const D6RecorderChannels = ({ channels }: D6RecorderChannelsProps) => {
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
