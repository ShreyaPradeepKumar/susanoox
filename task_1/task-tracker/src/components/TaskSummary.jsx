function TaskSummary({ total, pending, completed }) {
  return (
    <div className="flex justify-between border-t border-slate-200 pt-3 text-sm text-slate-600">
      <span>Total: {total}</span>
      <span>Pending: {pending}</span>
      <span>Completed: {completed}</span>
    </div>
  )
}

export default TaskSummary