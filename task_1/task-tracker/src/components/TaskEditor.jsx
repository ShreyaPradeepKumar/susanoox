function TaskEditor({
  draftTitle,
  draftPriority,
  editError,
  onDraftTitleChange,
  onDraftPriorityChange,
  onSave,
  onCancel,
}) {
  return (
    <form className="flex w-full flex-col gap-2" onSubmit={onSave}>
      <label htmlFor="task-edit-title" className="sr-only">
        Edit task title
      </label>
      <input
        id="task-edit-title"
        type="text"
        value={draftTitle}
        onChange={(event) => onDraftTitleChange(event.target.value)}
        autoFocus
        aria-invalid={editError ? 'true' : undefined}
        aria-describedby={editError ? 'task-edit-error' : undefined}
        className="rounded border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none"
      />
      {editError && (
        <p id="task-edit-error" className="text-sm text-red-600">
          {editError}
        </p>
      )}
      <div className="flex items-center gap-2">
        <label htmlFor="task-edit-priority" className="text-sm font-medium text-slate-700">
          Priority
        </label>
        <select
          id="task-edit-priority"
          value={draftPriority}
          onChange={(event) => onDraftPriorityChange(event.target.value)}
          className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default TaskEditor