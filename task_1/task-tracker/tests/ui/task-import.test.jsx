import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App.jsx'
import {
  STORAGE_KEY,
  loadTasksFromBrowser,
  saveTasksToBrowser,
} from '../../src/storage.js'

const apiTodos = [
  {
    userId: 1,
    id: 1,
    title: 'delectus aut autem',
    completed: false,
  },
  {
    userId: 1,
    id: 2,
    title: 'quis ut nam facilis et officia qui',
    completed: false,
  },
  {
    userId: 3,
    id: 4,
    title: 'et porro tempora',
    completed: true,
  },
]

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => payload,
  }
}

function createStorage(initialValue) {
  const values = new Map()
  let writeError = null

  if (initialValue !== undefined) {
    values.set(STORAGE_KEY, initialValue)
  }

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      if (writeError) throw writeError
      values.set(key, value)
    },
    read(key) {
      return values.get(key)
    },
    failWrite() {
      writeError = new Error('write blocked')
    },
    allowWrite() {
      writeError = null
    },
  }
}

function createProps(storage) {
  const getStorage = () => ({ storage, error: null })

  return {
    loadStorage: () => loadTasksFromBrowser(getStorage),
    saveStorage: (tasks) => saveTasksToBrowser(tasks, getStorage),
  }
}

function renderApp(storage) {
  return render(<App {...createProps(storage)} />)
}

function importRegion() {
  return screen.getByRole('region', { name: 'Import sample tasks' })
}

function stubFetch(...implementations) {
  const fetchMock = vi.fn()

  for (const implementation of implementations) {
    fetchMock.mockImplementationOnce(implementation)
  }

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Task 04 sample task loading', () => {
  it('does not request or change tasks until Load is clicked', async () => {
    const fetchMock = stubFetch(async () => jsonResponse(apiTodos))
    const storage = createStorage('[]')

    renderApp(storage)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.queryByText(apiTodos[0].title)).toBeNull()
    expect(
      screen.getByText('No tasks yet. Add your first one above.')
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Load sample tasks' }))

    const section = importRegion()
    await within(section).findByLabelText(apiTodos[0].title)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain(
      'jsonplaceholder.typicode.com/todos?_limit=5'
    )
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'GET' })
    expect(within(section).getByText('0 selected')).toBeTruthy()
    expect(
      within(section).getByRole('button', { name: 'Import selected tasks' })
        .disabled
    ).toBe(true)
    expect(
      screen.getByText('No tasks yet. Add your first one above.')
    ).toBeTruthy()
  })

  it('shows a loading state while the request is pending and handles an empty response', async () => {
    let resolveRequest
    stubFetch(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        })
    )
    const storage = createStorage('[]')

    renderApp(storage)
    fireEvent.click(screen.getByRole('button', { name: 'Load sample tasks' }))

    expect(
      screen.getByRole('button', { name: 'Loading sample tasks…' }).disabled
    ).toBe(true)
    expect(screen.getAllByText('Loading sample tasks…').length).toBeGreaterThan(0)

    await act(async () => {
      resolveRequest(jsonResponse([]))
    })

    expect(screen.getByText('No sample tasks available.')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: 'Import selected tasks' })
    ).toBeNull()
    expect(
      screen.getByText('No tasks yet. Add your first one above.')
    ).toBeTruthy()
  })

  it('shows a friendly error and retries the same request from a button', async () => {
    const fetchMock = stubFetch(
      async () => {
        throw new Error('offline')
      },
      async () => jsonResponse(apiTodos)
    )
    const storage = createStorage('[]')

    renderApp(storage)
    fireEvent.click(screen.getByRole('button', { name: 'Load sample tasks' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/Could not reach the sample task service/)
    expect(screen.getByText('No tasks yet. Add your first one above.')).toBeTruthy()

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }))

    const section = importRegion()
    await within(section).findByLabelText(apiTodos[0].title)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('Task 04 sample task selection and import', () => {
  it('appends selected tasks in preview order without changing existing tasks', async () => {
    const existing = {
      id: 'local-1',
      title: 'Local task',
      completed: true,
      priority: 'low',
    }
    const storage = createStorage(JSON.stringify([existing]))
    stubFetch(async () => jsonResponse(apiTodos))

    renderApp(storage)
    fireEvent.click(screen.getByRole('button', { name: 'Load sample tasks' }))

    const section = importRegion()
    const second = await within(section).findByLabelText(apiTodos[1].title)
    const first = within(section).getByLabelText(apiTodos[0].title)

    fireEvent.click(second)
    fireEvent.click(first)

    expect(within(section).getByText('2 selected')).toBeTruthy()

    fireEvent.click(
      within(section).getByRole('button', { name: 'Import selected tasks' })
    )

    await waitFor(() => {
      const savedTasks = JSON.parse(storage.read(STORAGE_KEY))
      expect(savedTasks).toEqual([
        existing,
        {
          id: 'jsonplaceholder-todo-1',
          title: apiTodos[0].title,
          completed: false,
          priority: 'medium',
        },
        {
          id: 'jsonplaceholder-todo-2',
          title: apiTodos[1].title,
          completed: false,
          priority: 'medium',
        },
      ])
    })

    expect(within(section).getByText('Imported 2 tasks.')).toBeTruthy()
    expect(within(section).getByText('0 selected')).toBeTruthy()
    expect(
      within(section).getByRole('button', { name: 'Import selected tasks' })
        .disabled
    ).toBe(true)
    expect(within(section).getByLabelText(apiTodos[0].title).disabled).toBe(true)
    expect(within(section).getByLabelText(apiTodos[1].title).disabled).toBe(true)
    expect(within(section).getAllByText(/Already imported/).length).toBe(2)
    expect(within(section).getByLabelText(apiTodos[2].title).disabled).toBe(false)
  })

  it('disables an already imported stable id and keeps its edited values', async () => {
    const existing = {
      id: 'jsonplaceholder-todo-1',
      title: 'My edited sample',
      completed: true,
      priority: 'high',
    }
    const storage = createStorage(JSON.stringify([existing]))
    stubFetch(async () => jsonResponse(apiTodos))

    renderApp(storage)
    fireEvent.click(screen.getByRole('button', { name: 'Load sample tasks' }))

    const section = importRegion()
    const importedCheckbox = await within(section).findByLabelText(apiTodos[0].title)
    expect(importedCheckbox.disabled).toBe(true)
    expect(within(section).getByText(/Already imported/)).toBeTruthy()

    fireEvent.click(within(section).getByLabelText(apiTodos[1].title))
    fireEvent.click(
      within(section).getByRole('button', { name: 'Import selected tasks' })
    )

    await waitFor(() => {
      const savedTasks = JSON.parse(storage.read(STORAGE_KEY))
      expect(savedTasks).toEqual([
        existing,
        {
          id: 'jsonplaceholder-todo-2',
          title: apiTodos[1].title,
          completed: false,
          priority: 'medium',
        },
      ])
    })

    expect(within(section).getByText('Imported 1 task.')).toBeTruthy()
  })

  it('keeps current search, filter, and sort settings after import', async () => {
    const storage = createStorage(
      JSON.stringify([
        { id: 'local-1', title: 'Local task', completed: true, priority: 'low' },
      ])
    )
    stubFetch(async () => jsonResponse(apiTodos))

    renderApp(storage)
    fireEvent.change(screen.getByLabelText('Search tasks'), {
      target: { value: 'Local' },
    })
    fireEvent.change(screen.getByLabelText('Sort'), {
      target: { value: 'high-to-low' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Load sample tasks' }))
    const section = importRegion()
    fireEvent.click(await within(section).findByLabelText(apiTodos[0].title))
    fireEvent.click(
      within(section).getByRole('button', { name: 'Import selected tasks' })
    )

    expect(screen.getByLabelText('Search tasks').value).toBe('Local')
    expect(screen.getByLabelText('Sort').value).toBe('high-to-low')
    expect(screen.getByText('Showing 1 of 2 tasks')).toBeTruthy()
    expect(screen.getAllByText(apiTodos[0].title)).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Clear search and filters' }))

    expect(screen.getByText('Showing 2 of 2 tasks')).toBeTruthy()
    expect(screen.getAllByText(apiTodos[0].title)).toHaveLength(2)
  })
})

describe('Task 04 edit and storage integration', () => {
  it('locks loading, selection, and import while an edit is open', async () => {
    const storage = createStorage(
      JSON.stringify([
        { id: 'local-1', title: 'Local task', completed: false, priority: 'low' },
      ])
    )
    stubFetch(async () => jsonResponse(apiTodos))

    renderApp(storage)
    fireEvent.click(screen.getByRole('button', { name: 'Load sample tasks' }))

    const section = importRegion()
    const previewCheckbox = await within(section).findByLabelText(apiTodos[0].title)
    fireEvent.click(previewCheckbox)

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])

    expect(screen.getByRole('button', { name: 'Load sample tasks' }).disabled).toBe(
      true
    )
    expect(previewCheckbox.disabled).toBe(true)
    expect(
      within(section).getByRole('button', { name: 'Import selected tasks' })
        .disabled
    ).toBe(true)
    expect(
      screen.getByText('Save or cancel your edit to load or import sample tasks.')
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(previewCheckbox.disabled).toBe(false)
    expect(previewCheckbox.checked).toBe(true)
    expect(
      within(section).getByRole('button', { name: 'Import selected tasks' })
        .disabled
    ).toBe(false)
  })

  it('keeps the edit open and import disabled if a pending request finishes during editing', async () => {
    let resolveRequest
    stubFetch(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        })
    )
    const storage = createStorage(
      JSON.stringify([
        { id: 'local-1', title: 'Local task', completed: false, priority: 'low' },
      ])
    )

    renderApp(storage)
    fireEvent.click(screen.getByRole('button', { name: 'Load sample tasks' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])

    await act(async () => {
      resolveRequest(jsonResponse(apiTodos))
    })

    const section = importRegion()
    await within(section).findByLabelText(apiTodos[0].title)

    expect(screen.getByLabelText('Edit task title').value).toBe('Local task')
    expect(within(section).getByLabelText(apiTodos[0].title).disabled).toBe(true)
    expect(
      within(section).getByRole('button', { name: 'Import selected tasks' })
        .disabled
    ).toBe(true)
    expect(screen.getByRole('button', { name: 'Load sample tasks' }).disabled).toBe(
      true
    )
  })

  it('imports while storage is temporary without saving, then saves the list on replacement', async () => {
    const storage = createStorage('{broken json')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    stubFetch(async () => jsonResponse(apiTodos))

    renderApp(storage)
    fireEvent.click(screen.getByRole('button', { name: 'Load sample tasks' }))

    const section = importRegion()
    fireEvent.click(await within(section).findByLabelText(apiTodos[2].title))
    fireEvent.click(
      within(section).getByRole('button', { name: 'Import selected tasks' })
    )

    expect(screen.getByText('Total: 1')).toBeTruthy()
    expect(screen.getByText('Completed: 1')).toBeTruthy()
    expect(screen.getByText(/Saved tasks could not be read/)).toBeTruthy()
    expect(storage.read(STORAGE_KEY)).toBe('{broken json')

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Replace saved data with current tasks',
      })
    )

    await waitFor(() => {
      expect(JSON.parse(storage.read(STORAGE_KEY))).toEqual([
        {
          id: 'jsonplaceholder-todo-4',
          title: apiTodos[2].title,
          completed: true,
          priority: 'medium',
        },
      ])
    })
    expect(screen.queryByText(/Saved tasks could not be read/)).toBeNull()
  })

  it('keeps imports in memory when saving fails and saves the latest list on retry', async () => {
    const storage = createStorage('[]')
    stubFetch(async () => jsonResponse(apiTodos))

    renderApp(storage)
    fireEvent.click(screen.getByRole('button', { name: 'Load sample tasks' }))

    const section = importRegion()
    fireEvent.click(await within(section).findByLabelText(apiTodos[0].title))

    storage.failWrite()
    fireEvent.click(
      within(section).getByRole('button', { name: 'Import selected tasks' })
    )

    expect(screen.getByText('Total: 1')).toBeTruthy()
    await waitFor(() => {
      expect(screen.getByText(/Changes could not be saved/)).toBeTruthy()
    })
    expect(storage.read(STORAGE_KEY)).toBe('[]')

    storage.allowWrite()
    fireEvent.click(screen.getByRole('button', { name: 'Retry saving' }))

    await waitFor(() => {
      expect(JSON.parse(storage.read(STORAGE_KEY))).toEqual([
        {
          id: 'jsonplaceholder-todo-1',
          title: apiTodos[0].title,
          completed: false,
          priority: 'medium',
        },
      ])
    })
    expect(screen.queryByText(/Changes could not be saved/)).toBeNull()
  })
})
