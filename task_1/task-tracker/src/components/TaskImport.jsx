function TaskImport({
  previewTasks,
  hasPreview,
  selectedIds,
  existingIds,
  isLoading,
  error,
  resultMessage,
  isEditing,
  selectedEligibleCount,
  canImport,
  onLoad,
  onToggleSelect,
  onImport,
}) {
  const loadDisabled = isLoading || isEditing

  return (
    <section
      aria-labelledby="import-heading"
      className="mt-5 border-t border-slate-200 pt-4"
    >
      <h2 id="import-heading" className="text-lg font-semibold text-slate-800">
        Import sample tasks
      </h2>
      <p className="mb-3 mt-1 text-sm text-slate-600">
        Load five sample tasks from JSONPlaceholder and choose which ones to add
        to this browser's tracker. Importing adds tasks and never replaces the
        tasks you already have.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onLoad}
          disabled={loadDisabled}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Loading sample tasks…' : 'Load sample tasks'}
        </button>
      </div>

      {isEditing && (
        <p className="mt-2 text-sm text-slate-600">
          Save or cancel your edit to load or import sample tasks.
        </p>
      )}

      <div
        role="status"
        aria-live="polite"
        className="mt-2 text-sm text-slate-700"
      >
        {isLoading && <p>Loading sample tasks…</p>}
        {!isLoading && resultMessage && <p>{resultMessage}</p>}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          <p className="mb-2">{error}</p>
          <button
            type="button"
            onClick={onLoad}
            disabled={loadDisabled}
            className="rounded border border-red-300 bg-white px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      {hasPreview && previewTasks.length === 0 && (
        <p className="mt-3 rounded border border-slate-200 px-3 py-4 text-center text-sm text-slate-600">
          No sample tasks available.
        </p>
      )}

      {hasPreview && previewTasks.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-sm font-medium text-slate-700">
            {selectedEligibleCount} selected
          </p>
          <ul className="mb-3 flex list-none flex-col gap-2">
            {previewTasks.map((task) => {
              const alreadyImported = existingIds.has(task.id)
              const checked = selectedIds.includes(task.id)
              const checkboxId = `preview-${task.id}`

              return (
                <li
                  key={task.id}
                  className="flex items-start gap-2 rounded border border-slate-200 px-3 py-2"
                >
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleSelect(task.id)}
                    disabled={alreadyImported || isLoading || isEditing}
                    className="mt-1 size-4 shrink-0 disabled:opacity-50"
                  />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={checkboxId}
                      className="block break-words text-slate-800"
                    >
                      {task.title}
                    </label>
                    <p className="mt-1 text-xs text-slate-600">
                      {task.completed ? 'Completed' : 'Pending'} · Medium priority
                      {alreadyImported ? ' · Already imported' : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={onImport}
            disabled={!canImport}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Import selected tasks
          </button>
        </div>
      )}
    </section>
  )
}

export default TaskImport
