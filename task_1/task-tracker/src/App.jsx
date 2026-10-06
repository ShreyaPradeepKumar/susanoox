import { useState } from 'react'
import FilterButtons from './components/FilterButtons.jsx'
import TaskInput from './components/TaskInput.jsx'
import TaskList from './components/TaskList.jsx'
import TaskSummary from './components/TaskSummary.jsx'
import { addTask, deleteTask, filterTasks, getCounts, toggleTask } from './tasks.js'

const startingTasks = [
  { id: 'a1', title: 'Practise JavaScript arrays', completed: false },
  { id: 'a2', title: 'Build the task tracker UI', completed: true },
  { id: 'a3', title: 'Practise JavaScript arrays', completed: false },
]

function App() {
  const [tasks, setTasks] = useState(startingTasks)
  const [title, setTitle] = useState('')
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')

  const counts = getCounts(tasks)
  const visibleTasks = filterTasks(tasks, filter)

  function handleAdd(event) {
    event.preventDefault()

    if (title.trim() === '') {
      setError('Please enter a task title.')
      return
    }

    setTasks(addTask(tasks, title))
    setTitle('')
    setError('')
  }

  function handleToggle(id) {
    setTasks(toggleTask(tasks, id))
  }

  function handleDelete(id) {
    setTasks(deleteTask(tasks, id))
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-5">
        <h1 className="mb-5 text-2xl font-bold text-slate-800">Task Tracker</h1>

        <TaskInput
          title={title}
          error={error}
          onTitleChange={setTitle}
          onSubmit={handleAdd}
        />
        <FilterButtons filter={filter} onFilterChange={setFilter} />
        <TaskList
          tasks={visibleTasks}
          filter={filter}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
        <TaskSummary
          total={counts.total}
          pending={counts.pending}
          completed={counts.completed}
        />
      </div>
    </div>
  )
}

export default App