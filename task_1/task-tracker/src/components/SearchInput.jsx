function SearchInput({ search, onSearchChange, disabled }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <label htmlFor="task-search" className="text-sm font-medium text-slate-700">
        Search
      </label>
      <input
        id="task-search"
        type="text"
        placeholder="Search tasks"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        disabled={disabled}
        className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none disabled:opacity-50"
      />
    </div>
  )
}

export default SearchInput