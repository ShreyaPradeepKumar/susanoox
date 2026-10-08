function SearchInput({ search, onSearchChange, disabled }) {
  return (
    <>
      <label htmlFor="task-search" className="sr-only">
        Search tasks
      </label>
      <input
        id="task-search"
        type="text"
        placeholder="Search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        disabled={disabled}
        className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none disabled:opacity-50"
      />
    </>
  )
}

export default SearchInput