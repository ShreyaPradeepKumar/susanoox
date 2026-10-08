import TaskItem from './TaskItem.jsx'

function TaskList({
  tasks,
  anyTasks,
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
    const message = anyTasks
      ? 'No tasks match your search and filters.'
      : 'No tasks yet. Add your first one above.'

    return (
      <p className="mb-4 rounded border border-slate-200 px-3 py-6 text-center text-sm text-slate-500">
        {message}
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