function TaskItem({ task, onToggle, onDelete }) {
  return (
    <li className="flex items-center gap-3 rounded border border-slate-200 px-3 py-2">
      <input
        id={`task-${task.id}`}
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="size-4 shrink-0"
      />
      <label
        htmlFor={`task-${task.id}`}
        className={`min-w-0 flex-1 break-words ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}
      >
        {task.title}
      </label>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="shrink-0 text-sm font-medium text-red-600 hover:text-red-800"
      >
        Delete
      </button>
    </li>
  )
}

export default TaskItem