const options = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

function FilterButtons({ filter, onFilterChange }) {
  return (
    <div className="mb-4 flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={filter === option.value}
          onClick={() => onFilterChange(option.value)}
          className={`rounded border px-3 py-1 text-sm font-medium ${
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