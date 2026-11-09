import { useEffect, useRef, useState } from 'react'
import FilterButtons from './components/FilterButtons.jsx'
import PriorityFilter from './components/PriorityFilter.jsx'
import SearchInput from './components/SearchInput.jsx'
import SortSelect from './components/SortSelect.jsx'
import TaskInput from './components/TaskInput.jsx'
import TaskImport from './components/TaskImport.jsx'
import TaskList from './components/TaskList.jsx'
import TaskSummary from './components/TaskSummary.jsx'
import { requestSampleTasks } from './taskApi.js'
import { loadTasksFromBrowser, saveTasksToBrowser } from './storage.js'
import {
  addTask,
  deleteTask,
  filterByPriority,
  filterTasks,
  getCounts,
  searchTasks,
  sortTasks,
  toggleTask,
  updateTask,
} from './tasks.js'

const startingTasks = [
  { id: 't1', title: 'Learn React basics', completed: false, priority: 'high' },
  { id: 't2', title: 'Practise JavaScript arrays', completed: true, priority: 'medium' },
  { id: 't3', title: 'Improve mobile layout', completed: false, priority: 'low' },
  { id: 't4', title: 'Learn React basics', completed: true, priority: 'low' },
]

function getInitialStorageState(loadStorage) {
  const result = loadStorage()
  return {
    status: result.status,
    tasks:
      result.status === 'loaded'
        ? result.tasks
        : result.status === 'missing'
          ? startingTasks
          : [],
    temporaryMode: result.status === 'invalid' || result.status === 'unreadable',
  }
}

function App({
  loadStorage = loadTasksFromBrowser,
  saveStorage = saveTasksToBrowser,
} = {}) {
  const [initialStorage] = useState(() => getInitialStorageState(loadStorage))
  const [tasks, setTasks] = useState(initialStorage.tasks)
  const [temporaryMode, setTemporaryMode] = useState(initialStorage.temporaryMode)
  const [saveError, setSaveError] = useState(null)
  const [pendingReplacement, setPendingReplacement] = useState(false)
  const [previewTasks, setPreviewTasks] = useState([])
  const [hasPreview, setHasPreview] = useState(false)
  const [selectedPreviewIds, setSelectedPreviewIds] = useState([])
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState(null)
  const [importMessage, setImportMessage] = useState('')

  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('original')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftPriority, setDraftPriority] = useState('medium')
  const [editError, setEditError] = useState('')
  const closedEditId = useRef(null)
  const isFirstMount = useRef(true)
  const previewRequestInFlight = useRef(false)
  const importLock = useRef(false)

  const counts = getCounts(tasks)
  const isEditing = editingId !== null
  const anyTasks = tasks.length > 0
  const isFiltered =
    filter !== 'all' || priorityFilter !== 'all' || search.trim() !== ''

  const statusFiltered = filterTasks(tasks, filter)
  const priorityFiltered = filterByPriority(statusFiltered, priorityFilter)
  const searched = searchTasks(priorityFiltered, search)
  const visibleTasks = sortTasks(searched, sort)

  const existingTaskIds = new Set(tasks.map((task) => task.id))
  const selectedEligibleCount = previewTasks.filter(
    (task) =>
      selectedPreviewIds.includes(task.id) && !existingTaskIds.has(task.id)
  ).length
  const canImport = !isEditing && !isPreviewLoading && selectedEligibleCount > 0

  useEffect(() => {
    if (editingId === null && closedEditId.current) {
      const stillVisible = visibleTasks.some(
        (task) => task.id === closedEditId.current
      )

      if (!stillVisible) {
        document.getElementById('task-search')?.focus()
      }

      closedEditId.current = null
    }
  }, [editingId, visibleTasks])

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      if (initialStorage.status === 'missing') {
        const result = saveStorage(tasks)
        if (!result.success) {
          queueMicrotask(() => setSaveError(result.error))
        }
      }
      return
    }

    if (temporaryMode) return

    const result = saveStorage(tasks)
    if (!result.success) {
      queueMicrotask(() => setSaveError(result.error))
    } else {
      queueMicrotask(() => setSaveError(null))
    }
  }, [tasks, temporaryMode, initialStorage.status, saveStorage])

  function handleAdd(event) {
    event.preventDefault()

    if (title.trim() === '') {
      setError('Please enter a task title.')
      return
    }

    setTasks(addTask(tasks, title, priority))
    setTitle('')
    setPriority('medium')
    setError('')
  }

  function handleToggle(id) {
    setTasks(toggleTask(tasks, id))
  }

  function handleDelete(id) {
    setTasks(deleteTask(tasks, id))
  }

  function handleClearFilters() {
    setFilter('all')
    setPriorityFilter('all')
    setSearch('')
  }

  function handleReplaceStoredData() {
    const count = tasks.length
    const message =
      count === 0
        ? 'Replace the saved task list with an empty list? This will replace any previously stored tasks.'
        : `Replace the saved task list with the current ${count} task(s)? This will replace any previously stored tasks.`

    if (!window.confirm(message)) {
      return
    }

    const result = saveStorage(tasks)
    if (result.success) {
      setTemporaryMode(false)
      setPendingReplacement(false)
      setSaveError(null)
    } else {
      setPendingReplacement(true)
      setSaveError(result.error)
    }
  }

  function handleRetrySave() {
    const result = saveStorage(tasks)
    if (result.success) {
      setSaveError(null)
      if (pendingReplacement) {
        setTemporaryMode(false)
      }
      setPendingReplacement(false)
    } else {
      setSaveError(result.error)
    }
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

    closedEditId.current = editingId
    setTasks(updateTask(tasks, editingId, draftTitle, draftPriority))
    setEditingId(null)
    setDraftTitle('')
    setDraftPriority('medium')
    setEditError('')
  }

  function handleCancel() {
    closedEditId.current = editingId
    setEditingId(null)
    setDraftTitle('')
    setDraftPriority('medium')
    setEditError('')
  }

  async function handleLoadSampleTasks() {
    if (isEditing || previewRequestInFlight.current) {
      return
    }

    previewRequestInFlight.current = true
    setIsPreviewLoading(true)
    setPreviewError(null)
    setImportMessage('')
    setPreviewTasks([])
    setSelectedPreviewIds([])
    setHasPreview(false)

    try {
      const result = await requestSampleTasks()

      if (result.ok) {
        setPreviewTasks(result.tasks)
        setHasPreview(true)
      } else {
        setPreviewError(result.message)
      }
    } catch {
      setPreviewError(
        'The sample task service could not be reached. Check your connection and try again.'
      )
    } finally {
      previewRequestInFlight.current = false
      setIsPreviewLoading(false)
    }
  }

  function handleTogglePreview(id) {
    if (isEditing || isPreviewLoading || existingTaskIds.has(id)) {
      return
    }

    setSelectedPreviewIds((current) =>
      current.includes(id)
        ? current.filter((taskId) => taskId !== id)
        : [...current, id]
    )
  }

  function handleImportSelected() {
    if (isEditing || isPreviewLoading || importLock.current) {
      return
    }

    importLock.current = true
    queueMicrotask(() => {
      importLock.current = false
    })

    const toAppend = previewTasks.filter(
      (task) =>
        selectedPreviewIds.includes(task.id) && !existingTaskIds.has(task.id)
    )

    setSelectedPreviewIds([])

    if (toAppend.length === 0) {
      setImportMessage('No selected sample tasks were eligible to import.')
      return
    }

    setTasks([...tasks, ...toAppend])
    setImportMessage(
      `Imported ${toAppend.length} task${toAppend.length === 1 ? '' : 's'}.`
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-5">
        {temporaryMode && (
          <div
            role="alert"
            className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          >
            <p className="mb-2">
              Saved tasks could not be read, so changes are temporary and will not be
              saved until you replace the stored data.
            </p>
            <button
              type="button"
              onClick={handleReplaceStoredData}
              disabled={isEditing}
              className="rounded border border-amber-300 bg-white px-3 py-1 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Replace saved data with current tasks
            </button>
          </div>
        )}

        {saveError && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <p className="mb-2">
              {pendingReplacement
                ? `Replacing the saved data failed: ${saveError}. Retry saving to replace the saved data with the current ${tasks.length} task(s) and resume automatic saving.`
                : `Changes could not be saved: ${saveError}. Your changes are still in memory but may be lost on refresh.`}
            </p>
            <button
              type="button"
              onClick={handleRetrySave}
              disabled={isEditing}
              className="rounded border border-red-300 bg-white px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Retry saving
            </button>
          </div>
        )}

        <div className="mb-5 flex items-center gap-3">
          <h1 className="shrink-0 text-2xl font-bold text-slate-800">Task Tracker</h1>
          <SearchInput
            search={search}
            onSearchChange={setSearch}
            disabled={isEditing}
          />
        </div>

        <TaskInput
          title={title}
          error={error}
          priority={priority}
          onTitleChange={setTitle}
          onPriorityChange={setPriority}
          onSubmit={handleAdd}
        />
        <FilterButtons
          filter={filter}
          onFilterChange={setFilter}
          disabled={isEditing}
        />
        <PriorityFilter
          priority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          disabled={isEditing}
        />
        <SortSelect
          sort={sort}
          onSortChange={setSort}
          disabled={isEditing}
        />
        {isFiltered && (
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={isEditing}
            className="mb-4 rounded border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear search and filters
          </button>
        )}
        {isEditing && (
          <p className="mb-4 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            Save or cancel your edit to change the list view.
          </p>
        )}
        <TaskList
          tasks={visibleTasks}
          anyTasks={anyTasks}
          editingId={editingId}
          disabled={isEditing}
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
          showing={visibleTasks.length}
        />
        <TaskImport
          previewTasks={previewTasks}
          hasPreview={hasPreview}
          selectedIds={selectedPreviewIds}
          existingIds={existingTaskIds}
          isLoading={isPreviewLoading}
          error={previewError}
          resultMessage={importMessage}
          isEditing={isEditing}
          selectedEligibleCount={selectedEligibleCount}
          canImport={canImport}
          onLoad={handleLoadSampleTasks}
          onToggleSelect={handleTogglePreview}
          onImport={handleImportSelected}
        />
        <p className="mt-4 text-center text-xs text-slate-500">
          Tasks are saved in this browser, not to an account or cloud service.
        </p>
      </div>
    </div>
  )
}

export default App
