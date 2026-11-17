function TaskInput({
  title,
  error,
  priority,
  disabled,
  onTitleChange,
  onPriorityChange,
  onSubmit,
}) {
  return (
    <form className="mb-4" onSubmit={onSubmit}>
      <label htmlFor="task-title" className="sr-only">
        Task title
      </label>
      <div className="flex gap-2">
        <input
          id="task-title"
          type="text"
          placeholder="Add a new task"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'task-title-error' : undefined}
          className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && (
        <p id="task-title-error" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <label htmlFor="task-priority" className="text-sm font-medium text-slate-700">
          Priority
        </label>
        <select
          id="task-priority"
          value={priority}
          onChange={(event) => onPriorityChange(event.target.value)}
          disabled={disabled}
          className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
    </form>
  )
}

export default TaskInput