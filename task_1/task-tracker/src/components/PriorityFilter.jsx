const options = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

function PriorityFilter({ priority, onPriorityChange, disabled }) {
  return (
    <div role="group" aria-label="Priority" className="mb-4 flex flex-wrap gap-2">
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