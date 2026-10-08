function TaskSummary({ total, pending, completed, showing }) {
  return (
    <div className="border-t border-slate-200 pt-3 text-sm text-slate-600">
      <div className="flex justify-between">
        <span>Total: {total}</span>
        <span>Pending: {pending}</span>
        <span>Completed: {completed}</span>
      </div>
      <p className="mt-1 text-center text-xs text-slate-500">
        Showing {showing} of {total} tasks
      </p>
    </div>
  )
}

export default TaskSummary