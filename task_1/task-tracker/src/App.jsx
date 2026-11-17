import { useCallback, useEffect, useRef, useState } from 'react'
import FilterButtons from './components/FilterButtons.jsx'
import PriorityFilter from './components/PriorityFilter.jsx'
import SearchInput from './components/SearchInput.jsx'
import SortSelect from './components/SortSelect.jsx'
import TaskInput from './components/TaskInput.jsx'
import TaskImport from './components/TaskImport.jsx'
import TaskList from './components/TaskList.jsx'
import TaskSummary from './components/TaskSummary.jsx'
import { requestSampleTasks } from './taskApi.js'
import * as taskCrudApi from './taskCrudApi.js'
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
  dataMode = 'browser',
  taskApi = taskCrudApi,
  loadStorage = loadTasksFromBrowser,
  saveStorage = saveTasksToBrowser,
} = {}) {
  const isApiMode = dataMode === 'api'
  const [initialStorage] = useState(() =>
    isApiMode
      ? { status: 'loaded', tasks: [] }
      : getInitialStorageState(loadStorage)
  )
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
  const [apiStatus, setApiStatus] = useState(isApiMode ? 'loading' : 'ready')
  const [apiError, setApiError] = useState(null)
  const [writeError, setWriteError] = useState(null)
  const [pendingWrite, setPendingWrite] = useState(false)
  const [writeMessage, setWriteMessage] = useState('')

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
  const apiLoadStarted = useRef(false)
  const apiLoadSequence = useRef(0)
  const writeInFlight = useRef(false)
  const lastWrite = useRef(null)
  const isMounted = useRef(true)

  const counts = getCounts(tasks)
  const isEditing = editingId !== null
  const anyTasks = tasks.length > 0
  const isBusy =
    isApiMode && (apiStatus !== 'ready' || pendingWrite || Boolean(writeError))
  const controlsDisabled = isEditing || isBusy
  const previewStatusMessage = hasPreview
    ? previewTasks.length === 0
      ? 'No sample tasks available.'
      : `${previewTasks.length} sample task${previewTasks.length === 1 ? '' : 's'} ready to preview.`
    : ''
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
    if (isApiMode) return

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
  }, [tasks, temporaryMode, initialStorage.status, saveStorage, isApiMode])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const loadApiTasks = useCallback(async () => {
    const requestId = ++apiLoadSequence.current
    setApiStatus('loading')
    setApiError(null)
    setWriteError(null)
    lastWrite.current = null

    let result

    try {
      result = await taskApi.fetchTasks()
    } catch {
      result = {
        ok: false,
        kind: 'network',
        message: 'Could not reach the local API. Check that JSON Server is running.',
      }
    }

    if (!isMounted.current || requestId !== apiLoadSequence.current) {
      return
    }

    if (result.ok) {
      setTasks(result.tasks)
      setApiStatus('ready')
      return
    }

    setApiStatus('error')
    setApiError(result.message || 'The local API could not be loaded. Try again.')
  }, [taskApi])

  useEffect(() => {
    if (!isApiMode || apiLoadStarted.current) {
      return
    }

    apiLoadStarted.current = true
    loadApiTasks()
  }, [isApiMode, loadApiTasks])

  async function runWrite(label, operation, onSuccess, onFailure) {
    if (writeInFlight.current) {
      return
    }

    writeInFlight.current = true
    lastWrite.current = { label, operation, onSuccess, onFailure }
    setPendingWrite(true)
    setWriteMessage(`Saving ${label}…`)
    setWriteError(null)

    let result

    try {
      result = await operation()
    } catch {
      result = {
        ok: false,
        kind: 'network',
        message: 'Could not reach the local API. Check that JSON Server is running.',
        uncertain: true,
      }
    }

    writeInFlight.current = false

    if (!isMounted.current) {
      return
    }

    setPendingWrite(false)
    setWriteMessage('')

    if (result.ok) {
      lastWrite.current = null
      onSuccess(result)
      return
    }

    setWriteError({
      message: result.message || 'The local API could not save this change.',
      uncertain: Boolean(result.uncertain || result.kind === 'network'),
    })
    onFailure?.(result)
  }

  function handleRetryWrite() {
    const pending = lastWrite.current

    if (!pending || writeInFlight.current) {
      return
    }

    void runWrite(
      pending.label,
      pending.operation,
      pending.onSuccess,
      pending.onFailure
    )
  }

  function handleAdd(event) {
    event.preventDefault()

    if (title.trim() === '') {
      setError('Please enter a task title.')
      return
    }

    if (isApiMode) {
      void runWrite(
        'new task',
        () => taskApi.createTask(title, priority),
        (result) => {
          setTasks((current) => [...current, result.task])
          setTitle('')
          setPriority('medium')
          setError('')
        },
        (result) => {
          if (result.kind === 'validation') {
            setError(result.message)
          }
        }
      )
      return
    }

    setTasks(addTask(tasks, title, priority))
    setTitle('')
    setPriority('medium')
    setError('')
  }

  function handleToggle(id) {
    if (isApiMode) {
      const task = tasks.find((item) => item.id === id)

      if (!task) {
        return
      }

      void runWrite(
        'completion change',
        () => taskApi.patchTask(id, { completed: !task.completed }),
        (result) => {
          setTasks((current) =>
            current.map((item) => (item.id === result.task.id ? result.task : item))
          )
        }
      )
      return
    }

    setTasks(toggleTask(tasks, id))
  }

  function handleDelete(id) {
    if (isApiMode) {
      void runWrite(
        'deletion',
        () => taskApi.deleteTask(id),
        () => {
          setTasks((current) => current.filter((task) => task.id !== id))
        }
      )
      return
    }

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

    if (isApiMode) {
      const id = editingId
      const nextTitle = draftTitle
      const nextPriority = draftPriority

      void runWrite(
        'edit',
        () => taskApi.patchTask(id, { title: nextTitle, priority: nextPriority }),
        (result) => {
          closedEditId.current = id
          setTasks((current) =>
            current.map((task) => (task.id === result.task.id ? result.task : task))
          )
          setEditingId(null)
          setDraftTitle('')
          setDraftPriority('medium')
          setEditError('')
        },
        (result) => {
          setEditError(result.message)
        }
      )
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
        {isApiMode && (
          <p className="mb-4 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">
            Local API mode
          </p>
        )}

        {isApiMode && (apiStatus === 'loading' || pendingWrite) && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          >
            {apiStatus === 'loading' ? 'Loading tasks…' : writeMessage}
          </div>
        )}

        {isApiMode && apiStatus === 'error' && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <p className="mb-2">
              {apiError} Tasks cannot be changed until the list loads.
            </p>
            <button
              type="button"
              onClick={loadApiTasks}
              className="rounded border border-red-300 bg-white px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Retry loading
            </button>
          </div>
        )}

        {isApiMode && writeError && (
          <div
            role="alert"
            className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            <p className="mb-2">{writeError.message}</p>
            <p className="mb-2">
              {writeError.uncertain
                ? 'The result is uncertain. Reload tasks from the API before trying again.'
                : 'Your list and drafts are unchanged. You can retry this change or reload tasks.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {!writeError.uncertain && (
                <button
                  type="button"
                  onClick={handleRetryWrite}
                  className="rounded border border-red-300 bg-white px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Retry this change
                </button>
              )}
              <button
                type="button"
                onClick={loadApiTasks}
                className="rounded border border-red-300 bg-white px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Reload tasks
              </button>
            </div>
          </div>
        )}

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
            disabled={controlsDisabled}
          />
        </div>


        <TaskInput
          title={title}
          error={error}
          priority={priority}
          disabled={isBusy}
          onTitleChange={setTitle}
          onPriorityChange={setPriority}
          onSubmit={handleAdd}
        />
        <FilterButtons
          filter={filter}
          onFilterChange={setFilter}
          disabled={controlsDisabled}
        />
        <PriorityFilter
          priority={priorityFilter}
          onPriorityChange={setPriorityFilter}
          disabled={controlsDisabled}
        />
        <SortSelect
          sort={sort}
          onSortChange={setSort}
          disabled={controlsDisabled}
        />
        {isFiltered && (
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={controlsDisabled}
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
          disabled={controlsDisabled}
          editorDisabled={isApiMode && pendingWrite}
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
        {!isApiMode && (
          <TaskImport
            previewTasks={previewTasks}
            hasPreview={hasPreview}
            selectedIds={selectedPreviewIds}
            existingIds={existingTaskIds}
            isLoading={isPreviewLoading}
            error={previewError}
            statusMessage={previewStatusMessage}
            resultMessage={importMessage}
            isEditing={isEditing}
            selectedEligibleCount={selectedEligibleCount}
            canImport={canImport}
            onLoad={handleLoadSampleTasks}
            onToggleSelect={handleTogglePreview}
            onImport={handleImportSelected}
          />
        )}
        <p className="mt-4 text-center text-xs text-slate-500">
          {isApiMode
            ? 'Tasks are stored by the local JSON Server API.'
            : 'Tasks are saved in this browser, not to an account or cloud service.'}
        </p>
      </div>
    </div>
  )
}

export default App
