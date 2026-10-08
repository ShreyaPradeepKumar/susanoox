const options = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

function PriorityFilter({ priority, onPriorityChange, disabled }) {
  return (
    <div role="group" aria-labelledby="priority-filter-label" className="mb-4 flex flex-wrap items-center gap-2">
      <span id="priority-filter-label" className="text-sm font-medium text-slate-700">
        Priority:
      </span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={priority === option.value}
          onClick={() => onPriorityChange(option.value)}
          disabled={disabled}
          className={`rounded border px-3 py-1 text-sm font-medium disabled:opacity-50 ${
            priority === option.value
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

export default PriorityFilter