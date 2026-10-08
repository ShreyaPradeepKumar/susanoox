const options = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

function FilterButtons({ filter, onFilterChange, disabled }) {
  return (
    <div role="group" aria-labelledby="status-filter-label" className="mb-4 flex flex-wrap items-center gap-2">
      <span id="status-filter-label" className="text-sm font-medium text-slate-700">
        Status:
      </span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={filter === option.value}
          onClick={() => onFilterChange(option.value)}
          disabled={disabled}
          className={`rounded border px-3 py-1 text-sm font-medium disabled:opacity-50 ${
            filter === option.value
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default FilterButtons