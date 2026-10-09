import { useEffect, useRef } from 'react'
import TaskEditor from './TaskEditor.jsx'

const priorityStyles = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
}

const priorityLabels = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

function TaskItem({
  task,
  editing,
  disabled,
  onToggle,
  onDelete,
  onEdit,
  draftTitle,
  draftPriority,
  editError,
  onDraftTitleChange,
  onDraftPriorityChange,
  onSave,
  onCancel,
}) {
  const editButtonRef = useRef(null)
  const wasEditing = useRef(false)

  useEffect(() => {
    if (wasEditing.current && !editing) {
      editButtonRef.current?.focus()
    }

    wasEditing.current = editing
  }, [editing])

  if (editing) {
    return (
      <li className="rounded border border-slate-200 px-3 py-2">
        <TaskEditor
          draftTitle={draftTitle}
          draftPriority={draftPriority}
          editError={editError}
          onDraftTitleChange={onDraftTitleChange}
          onDraftPriorityChange={onDraftPriorityChange}
          onSave={onSave}
          onCancel={onCancel}
        />
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 rounded border border-slate-200 px-3 py-2">
      <input
        id={`task-${task.id}`}
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        disabled={disabled}
        className="size-4 shrink-0 disabled:opacity-50"
      />
      <label
        htmlFor={`task-${task.id}`}
        className={`min-w-0 flex-1 break-words ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}
      >
        {task.title}
      </label>
      <span
        className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${priorityStyles[task.priority]}`}
      >
        {priorityLabels[task.priority]}
      </span>
      <button
        type="button"
        ref={editButtonRef}
        onClick={() => onEdit(task)}
        disabled={disabled}
        className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        disabled={disabled}
        className="shrink-0 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        Delete
      </button>
    </li>
  )
}

export default TaskItem