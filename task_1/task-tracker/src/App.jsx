import { useState } from 'react'
import FilterButtons from './components/FilterButtons.jsx'
import SortSelect from './components/SortSelect.jsx'
import TaskInput from './components/TaskInput.jsx'
import TaskList from './components/TaskList.jsx'
import TaskSummary from './components/TaskSummary.jsx'
import { addTask, deleteTask, filterTasks, getCounts, sortTasks, toggleTask, updateTask } from './tasks.js'

const startingTasks = [
  { id: 't1', title: 'Learn React basics', completed: false, priority: 'high' },
  { id: 't2', title: 'Practise JavaScript arrays', completed: true, priority: 'medium' },
  { id: 't3', title: 'Improve mobile layout', completed: false, priority: 'low' },
  { id: 't4', title: 'Learn React basics', completed: true, priority: 'low' },
]

function App() {
  const [tasks, setTasks] = useState(startingTasks)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('original')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftPriority, setDraftPriority] = useState('medium')
  const [editError, setEditError] = useState('')

  const counts = getCounts(tasks)
  const visibleTasks = sortTasks(filterTasks(tasks, filter), sort)

  function handleAdd(event) {
    event.preventDefault()

    if (title.trim() === '') {
      setError('Please enter a task title.')
      return
    }

    setTasks(addTask(tasks, title, priority))
    setTitle('')
    setError('')
  }

  function handleToggle(id) {
    setTasks(toggleTask(tasks, id))
  }

  function handleDelete(id) {
    setTasks(deleteTask(tasks, id))
  }

  function handleEdit(task) {
    setEditingId(task.id)
    setDraftTitle(task.title)
    setDraftPriority(task.priority)
    setEditError('')
  }

  function handleSave(event) {
    event.preventDefault()

    if (draftTitle.trim() === '') {
      setEditError('Please enter a task title.')
      return
    }

    setTasks(updateTask(tasks, editingId, draftTitle, draftPriority))
    setEditingId(null)
    setDraftTitle('')
    setDraftPriority('medium')
    setEditError('')
  }

  function handleCancel() {
    setEditingId(null)
    setDraftTitle('')
    setDraftPriority('medium')
    setEditError('')
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-5">
        <h1 className="mb-5 text-2xl font-bold text-slate-800">Task Tracker</h1>

        <TaskInput
          title={title}
          error={error}
          priority={priority}
          onTitleChange={setTitle}
          onPriorityChange={setPriority}
          onSubmit={handleAdd}
        />
        <FilterButtons filter={filter} onFilterChange={setFilter} />
        <SortSelect sort={sort} onSortChange={setSort} />
        <TaskList
          tasks={visibleTasks}
          filter={filter}
          editingId={editingId}
          disabled={editingId !== null}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onEdit={handleEdit}
          draftTitle={draftTitle}
          draftPriority={draftPriority}
          editError={editError}
          onDraftTitleChange={setDraftTitle}
          onDraftPriorityChange={setDraftPriority}
          onSave={handleSave}
          onCancel={handleCancel}
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