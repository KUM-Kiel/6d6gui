import { Task } from "../../../electron-app/spawn-process"
import TaskComponent from './task'
import React from "react"

type TaskManagerProps = {
  taskList: Task[],
  triggerAction: (id: string, action: string) => void,
  appDarkMode: boolean
}

// UI for the whole TaskManager content i.e. tasks.
const TaskManager = ({ taskList, triggerAction, appDarkMode }: TaskManagerProps) => {
  const activateAction = (id: string, action: string) => {
    triggerAction(id, action)
  }
  if (taskList.length === 0) {
    return []
  } else {
    return <div className="task-manager">
      <div className="task-manager-header">Task Manager</div>
      <div className="task-manager-main">
        {taskList.map((task: Task) => (
          <TaskComponent activateAction={activateAction} task={task} key={task.id} darkMode={appDarkMode} />
        ))}
      </div>
    </div>
  }
}

export default TaskManager
