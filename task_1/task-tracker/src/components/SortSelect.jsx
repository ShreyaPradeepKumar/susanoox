function SortSelect({ sort, onSortChange, disabled }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <label htmlFor="task-sort" className="text-sm font-medium text-slate-700">
        Sort
      </label>
      <select
        id="task-sort"
        value={sort}
        onChange={(event) => onSortChange(event.target.value)}
        disabled={disabled}
        className="flex-1 rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-700 disabled:opacity-50"
      >
        <option value="original">Original order</option>
        <option value="high-to-low">Priority: High to Low</option>
      </select>
    </div>
  )
}

export default SortSelect