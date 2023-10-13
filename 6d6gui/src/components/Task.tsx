import React from "react"
import IconButton from './IconButton'
import { Task } from "../../../electron-app/spawnProcess"

type TaskProps = {
  task: Task,
  activateAction: Function,
  darkMode: boolean
}

// UI for Task 'containers'.
const Task = ({ task, activateAction, darkMode }: TaskProps) => {
  return (
    <div className="task-container">
      <div className="task" title={task.description}>
        <div className="task-info">
          <div className="task-row">
            <div>{task.title}</div>
            <div>ID: {task.id}</div>
          </div>
          <div className="task-row">
            <div className={task.finished ? 'progress-bar' : 'progress-bar running'}>
              <div style={{ width: + task.percentage.toFixed(2) + '%' }}></div>
            </div>
            <div>{task.percentage.toFixed(2)}%</div>
          </div>
          <div className="task-row">
            <div>{task.progress}</div>
            <div>Done in {task.eta}</div>
          </div>
        </div>
        <div>
          {task.actions.map(action => (
            <div>
              <IconButton activateAction={activateAction} taskId={task.id} action={action} darkMode={darkMode} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Task