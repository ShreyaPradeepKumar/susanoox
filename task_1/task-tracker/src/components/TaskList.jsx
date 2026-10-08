import TaskItem from './TaskItem.jsx'

const emptyMessages = {
  all: 'No tasks yet. Add your first one above.',
  pending: 'No pending tasks. Everything is done!',
  completed: 'No completed tasks yet.',
}

function TaskList({
  tasks,
  filter,
  editingId,
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
          editing={editingId === task.id}
          disabled={disabled}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          draftTitle={draftTitle}
          draftPriority={draftPriority}
          editError={editError}
          onDraftTitleChange={onDraftTitleChange}
          onDraftPriorityChange={onDraftPriorityChange}
          onSave={onSave}
          onCancel={onCancel}
        />
      ))}
    </ul>
  )
}

export default TaskList