import { Task } from "../../../electron-app/spawnProcess"
import IconButton from './IconButton'
import React from "react"

type TaskProps = {
  task: Task,
  activateAction: (id: string, action: string) => void,
  darkMode: boolean
}

// UI for Task 'containers'.
const TaskComponent = ({ task, activateAction, darkMode }: TaskProps) => {
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
            <div key={action}>
              <IconButton activateAction={activateAction} taskId={task.id} action={action} darkMode={darkMode} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TaskComponent
