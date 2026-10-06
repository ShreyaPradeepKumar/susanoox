function TaskInput({ title, error, onTitleChange, onSubmit }) {
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
          className="flex-1 rounded border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  )
}

export default TaskInput