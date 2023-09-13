import Task from './Task'

// UI for the whole TaskManager content i.e. tasks.
const TaskManager = ({ taskList, triggerAction, appDarkMode}) => {
  const activateAction = (id, action) => {
    console.log('maybe this muppet is actually triggering')
    triggerAction(id, action)
  }
  if (taskList.length === 0) {
    return []
  } else {
    return <div className="task-manager">
      <div className="task-manager-header">Task Manager</div>
      <div className="task-manager-main">
        {taskList.map(task => (
          <Task activateAction={activateAction} task={task} key={task.id} darkMode={appDarkMode}/>
        ))}
      </div>
    </div>
  }
}

export default TaskManager
