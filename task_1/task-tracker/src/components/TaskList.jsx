import TaskItem from './TaskItem.jsx'

const emptyMessages = {
  all: 'No tasks yet. Add your first one above.',
  pending: 'No pending tasks. Everything is done!',
  completed: 'No completed tasks yet.',
}

function TaskList({ tasks, filter, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return (
      <p className="mb-4 rounded border border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
        {emptyMessages[filter]}
      </p>
    )
  }

  return (
    <ul className="mb-4 flex list-none flex-col gap-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

export default TaskList