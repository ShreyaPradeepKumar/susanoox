import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App.jsx'
import {
  STORAGE_KEY,
  loadTasksFromBrowser,
  saveTasksToBrowser,
} from '../../src/storage.js'

function createStorage(initialValue, extraValues = {}) {
  const values = new Map(Object.entries(extraValues))

  if (initialValue !== undefined) {
    values.set(STORAGE_KEY, initialValue)
  }

  let readError = null
  let writeError = null

  return {
    getItem(key) {
      if (readError) throw readError
      return values.has(key) ? values.get(key) : null
    },
    setItem(key, value) {
      if (writeError) throw writeError
      values.set(key, value)
    },
    read(key) {
      return values.get(key)
    },
    failRead(error = new Error('read blocked')) {
      readError = error
    },
    allowRead() {
      readError = null
    },
    failWrite(error = new Error('write blocked')) {
      writeError = error
    },
    allowWrite() {
      writeError = null
    },
  }
}

function createProps(storage, accessError) {
  const getStorage = accessError
    ? () => {
        throw accessError
      }
    : () => ({ storage, error: null })

  return {
    loadStorage: () => loadTasksFromBrowser(getStorage),
    saveStorage: (tasks) => saveTasksToBrowser(tasks, getStorage),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Task 03 interface corrections', () => {
  it('resets the add form to an empty title and Medium priority after a successful add', () => {
    const storage = createStorage()
    render(<App {...createProps(storage)} />)

    const titleInput = screen.getByLabelText('Task title')
    const prioritySelect = screen.getByLabelText('Priority')

    fireEvent.change(titleInput, { target: { value: 'Water the plants' } })
    fireEvent.change(prioritySelect, { target: { value: 'high' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(titleInput.value).toBe('')
    expect(prioritySelect.value).toBe('medium')

    const taskRow = screen.getByText('Water the plants').closest('li')
    expect(within(taskRow).getByText('High')).toBeTruthy()
  })

  it('disables all view controls while editing and restores them on cancel', () => {
    const storage = createStorage()
    render(<App {...createProps(storage)} />)

    fireEvent.change(screen.getByLabelText('Search tasks'), {
      target: { value: 'react' },
    })
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])

    expect(screen.getByLabelText('Search tasks').disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'All' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Pending' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Completed' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Low' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Medium' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'High' }).disabled).toBe(true)
    expect(screen.getByLabelText('Sort').disabled).toBe(true)
    expect(
      screen.getByRole('button', { name: 'Clear search and filters' }).disabled
    ).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByLabelText('Search tasks').disabled).toBe(false)
    expect(screen.getByRole('button', { name: 'Pending' }).disabled).toBe(false)
    expect(screen.getByLabelText('Sort').disabled).toBe(false)
  })

  it('renders temporary mode when accessing localStorage itself throws', () => {
    render(
      <App {...createProps(null, new Error('storage access blocked'))} />
    )

    expect(screen.getByText('Task Tracker')).toBeTruthy()
    expect(screen.getByText(/Saved tasks could not be read/)).toBeTruthy()
    expect(screen.getByText('No tasks yet. Add your first one above.')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Replace saved data with current tasks' })
    ).toBeTruthy()
  })

  it('renders temporary mode when getItem throws', () => {
    const storage = createStorage('[]')
    storage.failRead()

    render(<App {...createProps(storage)} />)

    expect(screen.getByText('Task Tracker')).toBeTruthy()
    expect(screen.getByText(/Saved tasks could not be read/)).toBeTruthy()
    expect(screen.getByText('No tasks yet. Add your first one above.')).toBeTruthy()
  })

  it('keeps changes in memory and warns when setItem throws', async () => {
    const saved = JSON.stringify([
      { id: 't1', title: 'Saved task', completed: false, priority: 'low' },
    ])
    const storage = createStorage(saved)
    storage.failWrite()

    render(<App {...createProps(storage)} />)

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Unsaved task' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByText('Unsaved task')).toBeTruthy()
    await waitFor(() => {
      expect(screen.getByText(/Changes could not be saved/)).toBeTruthy()
    })
    expect(storage.read(STORAGE_KEY)).toBe(saved)
  })
})

describe('Task 03 replacement retry correction', () => {
  it('resumes automatic saving after a failed replacement retry succeeds', async () => {
    const storage = createStorage('{broken json')
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const view = render(<App {...createProps(storage)} />)

    expect(screen.getByText(/Saved tasks could not be read/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Temporary task' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(screen.getByText('Temporary task')).toBeTruthy()

    storage.failWrite()
    fireEvent.click(
      screen.getByRole('button', { name: 'Replace saved data with current tasks' })
    )

    await waitFor(() => {
      expect(screen.getByText(/Replacing the saved data failed/)).toBeTruthy()
    })
    expect(storage.read(STORAGE_KEY)).toBe('{broken json')

    storage.allowWrite()
    fireEvent.click(screen.getByRole('button', { name: 'Retry saving' }))

    await waitFor(() => {
      expect(screen.queryByText(/Saved tasks could not be read/)).toBeNull()
      expect(screen.queryByText(/Replacing the saved data failed/)).toBeNull()
    })

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Saved later' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    await waitFor(() => {
      const savedTasks = JSON.parse(storage.read(STORAGE_KEY))
      expect(savedTasks.map((task) => task.title)).toEqual([
        'Temporary task',
        'Saved later',
      ])
    })

    view.unmount()
    render(<App {...createProps(storage)} />)

    expect(screen.getByText('Temporary task')).toBeTruthy()
    expect(screen.getByText('Saved later')).toBeTruthy()
  })

  it('keeps the stored text and temporary warning when replacement is cancelled', () => {
    const storage = createStorage('{broken json')
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<App {...createProps(storage)} />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Replace saved data with current tasks' })
    )

    expect(storage.read(STORAGE_KEY)).toBe('{broken json')
    expect(screen.getByText(/Saved tasks could not be read/)).toBeTruthy()
  })

  it('keeps the replacement warning after repeated retry failures', async () => {
    const storage = createStorage('{broken json')
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<App {...createProps(storage)} />)
    storage.failWrite()
    fireEvent.click(
      screen.getByRole('button', { name: 'Replace saved data with current tasks' })
    )

    await waitFor(() => {
      expect(screen.getByText(/Replacing the saved data failed/)).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Retry saving' }))

    await waitFor(() => {
      expect(screen.getByText(/Replacing the saved data failed/)).toBeTruthy()
    })
    expect(storage.read(STORAGE_KEY)).toBe('{broken json')
  })

  it('replaces unreadable data with an empty list and keeps unrelated keys', async () => {
    const storage = createStorage('{broken json', { unrelated: 'keep me' })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const view = render(<App {...createProps(storage)} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Replace saved data with current tasks' })
    )

    await waitFor(() => {
      expect(storage.read(STORAGE_KEY)).toBe('[]')
    })
    expect(storage.read('unrelated')).toBe('keep me')
    expect(screen.queryByText(/Saved tasks could not be read/)).toBeNull()

    view.unmount()
    render(<App {...createProps(storage)} />)

    expect(screen.getByText('No tasks yet. Add your first one above.')).toBeTruthy()
  })
})
