import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App.jsx'

const seedTasks = [
  { id: 't1', title: 'Practise fetch', completed: false, priority: 'high' },
  { id: 't2', title: 'Check a failed save', completed: true, priority: 'medium' },
  { id: 't3', title: 'Practise delete', completed: false, priority: 'low' },
]

function createApi(initialTasks = seedTasks) {
  let tasks = [...initialTasks]
  let counter = 0

  const api = {
    fetchTasks: vi.fn(async () => ({ ok: true, tasks: [...tasks] })),
    createTask: vi.fn(async (title, priority) => {
      const task = {
        id: `api-${++counter}`,
        title: title.trim(),
        completed: false,
        priority,
      }
      tasks = [...tasks, task]
      return { ok: true, task }
    }),
    patchTask: vi.fn(async (id, changes) => {
      const existing = tasks.find((task) => task.id === id)

      if (!existing) {
        return { ok: false, kind: 'http', message: 'Task not found.' }
      }

      const task = { ...existing, ...changes }
      tasks = tasks.map((item) => (item.id === id ? task : item))
      return { ok: true, task }
    }),
    deleteTask: vi.fn(async (id) => {
      tasks = tasks.filter((task) => task.id !== id)
      return { ok: true, id }
    }),
  }

  api.serverTasks = () => tasks
  return api
}

function renderApiApp(api) {
  return render(<App dataMode="api" taskApi={api} />)
}

function findRow(title) {
  return screen.getByText(title).closest('li')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('local API mode startup', () => {
  it('loads tasks on mount, disables changes while loading, and never uses browser storage', async () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const api = createApi()

    renderApiApp(api)

    expect(screen.getByText('Local API mode')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Loading tasks…')
    expect(screen.getByLabelText('Task title').disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Add' }).disabled).toBe(true)
    expect(screen.getByLabelText('Search tasks').disabled).toBe(true)
    expect(screen.queryByRole('region', { name: 'Import sample tasks' })).toBeNull()
    expect(api.fetchTasks).toHaveBeenCalledTimes(1)

    expect(await screen.findByText('Practise fetch')).toBeTruthy()
    expect(screen.queryByText('Loading tasks…')).toBeNull()
    expect(screen.getByText('Total: 3')).toBeTruthy()
    expect(screen.getByText('Tasks are stored by the local JSON Server API.')).toBeTruthy()
    expect(getItem).not.toHaveBeenCalled()
    expect(setItem).not.toHaveBeenCalled()
  })

  it('accepts a valid empty list and keeps the app usable', async () => {
    const api = createApi([])

    renderApiApp(api)

    await waitFor(() => {
      expect(api.fetchTasks).toHaveBeenCalledTimes(1)
    })

    expect(
      await screen.findByText('No tasks yet. Add your first one above.')
    ).toBeTruthy()
    expect(screen.getByText('Total: 0')).toBeTruthy()
    expect(screen.getByLabelText('Task title').disabled).toBe(false)
  })

  it('shows a GET failure and retries only when the user asks', async () => {
    const api = createApi()
    api.fetchTasks
      .mockResolvedValueOnce({
        ok: false,
        kind: 'http',
        message: 'The local API returned HTTP 500. Try again.',
      })
      .mockResolvedValueOnce({ ok: true, tasks: [...seedTasks] })

    renderApiApp(api)

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/HTTP 500/)
    expect(screen.getByLabelText('Task title').disabled).toBe(true)
    expect(api.fetchTasks).toHaveBeenCalledTimes(1)

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry loading' }))

    expect(await screen.findByText('Practise fetch')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(api.fetchTasks).toHaveBeenCalledTimes(2)
    expect(screen.getByLabelText('Task title').disabled).toBe(false)
  })
})

describe('local API mode CRUD', () => {
  it('adds a task with the id returned by POST and resets the form', async () => {
    const api = createApi()

    renderApiApp(api)
    await screen.findByText('Practise fetch')

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: '  Check POST  ' },
    })
    fireEvent.change(screen.getByLabelText('Priority'), {
      target: { value: 'high' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Check POST')).toBeTruthy()
    expect(api.createTask).toHaveBeenCalledWith('  Check POST  ', 'high')
    expect(screen.getByLabelText('Task title').value).toBe('')
    expect(screen.getByLabelText('Priority').value).toBe('medium')
    expect(screen.getByText('Total: 4')).toBeTruthy()
    expect(api.serverTasks().at(-1)).toEqual({
      id: 'api-1',
      title: 'Check POST',
      completed: false,
      priority: 'high',
    })
  })

  it('toggles completion with PATCH and preserves other tasks', async () => {
    const api = createApi()

    renderApiApp(api)
    await screen.findByText('Practise fetch')

    fireEvent.click(screen.getByLabelText('Practise fetch'))

    await waitFor(() => {
      expect(api.patchTask).toHaveBeenCalledWith('t1', { completed: true })
    })

    const checkbox = screen.getByLabelText('Practise fetch')
    expect(checkbox.checked).toBe(true)
    expect(screen.getByLabelText('Check a failed save').checked).toBe(true)
    expect(screen.getByLabelText('Practise delete').checked).toBe(false)
    expect(screen.getByText('Completed: 2')).toBeTruthy()
  })

  it('edits title and priority with PATCH and closes the editor on success', async () => {
    const api = createApi()

    renderApiApp(api)
    await screen.findByText('Check a failed save')

    fireEvent.click(within(findRow('Check a failed save')).getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Edit task title'), {
      target: { value: 'Check PATCH' },
    })
    fireEvent.change(screen.getByLabelText('Priority', { selector: '#task-edit-priority' }), {
      target: { value: 'low' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Check PATCH')).toBeTruthy()
    expect(api.patchTask).toHaveBeenCalledWith('t2', {
      title: 'Check PATCH',
      priority: 'low',
    })
    expect(screen.queryByLabelText('Edit task title')).toBeNull()
    expect(within(findRow('Check PATCH')).getByText('Low')).toBeTruthy()
  })

  it('deletes with DELETE and removes only the chosen task', async () => {
    const api = createApi()

    renderApiApp(api)
    await screen.findByText('Practise delete')

    fireEvent.click(within(findRow('Practise delete')).getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(api.deleteTask).toHaveBeenCalledWith('t3')
    })

    expect(screen.queryByText('Practise delete')).toBeNull()
    expect(screen.getByText('Practise fetch')).toBeTruthy()
    expect(screen.getByText('Check a failed save')).toBeTruthy()
    expect(screen.getByText('Total: 2')).toBeTruthy()
  })
})

describe('local API mode pending and failure handling', () => {
  it('shows pending text and prevents a second write while one is in flight', async () => {
    let resolveCreate
    const api = createApi()
    api.createTask.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve
        })
    )

    renderApiApp(api)
    await screen.findByText('Practise fetch')

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Pending task' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByRole('status').textContent).toContain('Saving new task…')
    expect(screen.getByRole('button', { name: 'Add' }).disabled).toBe(true)
    expect(screen.getByLabelText('Practise fetch').disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(api.createTask).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveCreate({
        ok: true,
        task: {
          id: 'api-1',
          title: 'Pending task',
          completed: false,
          priority: 'medium',
        },
      })
    })

    expect(await screen.findByText('Pending task')).toBeTruthy()
    expect(screen.queryByText('Saving new task…')).toBeNull()
    expect(screen.getByLabelText('Practise fetch').disabled).toBe(false)
  })

  it('keeps the title and priority after an HTTP rejection and retries only on click', async () => {
    const api = createApi()
    api.createTask
      .mockResolvedValueOnce({
        ok: false,
        kind: 'http',
        message: 'The local API rejected the new task with HTTP 400.',
      })
      .mockResolvedValueOnce({
        ok: true,
        task: {
          id: 'api-1',
          title: 'Retry task',
          completed: false,
          priority: 'high',
        },
      })

    renderApiApp(api)
    await screen.findByText('Practise fetch')

    const titleInput = screen.getByLabelText('Task title')
    const priorityInput = screen.getByLabelText('Priority')
    fireEvent.change(titleInput, { target: { value: 'Retry task' } })
    fireEvent.change(priorityInput, { target: { value: 'high' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/HTTP 400/)
    expect(alert.textContent).toMatch(/Your list and drafts are unchanged/)
    expect(titleInput.value).toBe('Retry task')
    expect(priorityInput.value).toBe('high')
    expect(screen.getByText('Total: 3')).toBeTruthy()
    expect(api.createTask).toHaveBeenCalledTimes(1)

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry this change' }))

    expect(await screen.findByText('Retry task')).toBeTruthy()
    expect(titleInput.value).toBe('')
    expect(priorityInput.value).toBe('medium')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(api.createTask).toHaveBeenCalledTimes(2)
  })

  it('does not offer a write retry after a network failure and reloads on request', async () => {
    const api = createApi()
    api.createTask.mockResolvedValueOnce({
      ok: false,
      kind: 'network',
      message: 'Could not reach the local API. Check that JSON Server is running.',
      uncertain: true,
    })

    renderApiApp(api)
    await screen.findByText('Practise fetch')

    fireEvent.change(screen.getByLabelText('Task title'), {
      target: { value: 'Uncertain task' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toMatch(/result is uncertain/)
    expect(within(alert).queryByRole('button', { name: 'Retry this change' })).toBeNull()
    expect(screen.getByLabelText('Task title').value).toBe('Uncertain task')
    expect(screen.getByText('Total: 3')).toBeTruthy()

    fireEvent.click(within(alert).getByRole('button', { name: 'Reload tasks' }))

    await waitFor(() => {
      expect(api.fetchTasks).toHaveBeenCalledTimes(2)
    })
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText('Total: 3')).toBeTruthy()
  })

  it('keeps the editor and draft when PATCH fails, then completes via retry', async () => {
    const api = createApi()
    api.patchTask
      .mockResolvedValueOnce({
        ok: false,
        kind: 'http',
        message: 'The local API rejected the change with HTTP 500.',
      })
      .mockResolvedValueOnce({
        ok: true,
        task: {
          id: 't1',
          title: 'Edited draft',
          completed: false,
          priority: 'high',
        },
      })

    renderApiApp(api)
    await screen.findByText('Practise fetch')

    fireEvent.click(within(findRow('Practise fetch')).getByRole('button', { name: 'Edit' }))
    fireEvent.change(screen.getByLabelText('Edit task title'), {
      target: { value: 'Edited draft' },
    })
    fireEvent.change(screen.getByLabelText('Priority', { selector: '#task-edit-priority' }), {
      target: { value: 'high' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    const alert = await screen.findByRole('alert')
    expect(screen.getByLabelText('Edit task title').value).toBe('Edited draft')
    expect(
      screen.getAllByText('The local API rejected the change with HTTP 500.').length
    ).toBeGreaterThan(0)
    expect(screen.getByText('Total: 3')).toBeTruthy()

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry this change' }))

    expect(await screen.findByText('Edited draft')).toBeTruthy()
    expect(screen.queryByLabelText('Edit task title')).toBeNull()
    expect(api.patchTask).toHaveBeenCalledTimes(2)
  })
})
