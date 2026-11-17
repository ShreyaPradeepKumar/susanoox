import { isValidPriority } from './priority.js'
import { validateTask, validateTaskList } from './storage.js'

export const LOCAL_API_BASE_URL = 'http://127.0.0.1:3001'
export const TASKS_URL = `${LOCAL_API_BASE_URL}/tasks`

const JSON_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

function failure(kind, message, uncertain = false) {
  return { ok: false, kind, message, uncertain }
}

function networkFailure(uncertain = false) {
  return failure(
    'network',
    'Could not reach the local API. Check that JSON Server is running.',
    uncertain
  )
}

function isNonBlankString(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function isValidId(value) {
  return isNonBlankString(value)
}

function validateCreate(title, priority) {
  if (!isNonBlankString(title)) {
    return { valid: false, message: 'Please enter a task title.' }
  }

  if (!isValidPriority(priority)) {
    return { valid: false, message: 'Please choose a valid priority.' }
  }

  return {
    valid: true,
    body: {
      title: title.trim(),
      completed: false,
      priority,
    },
  }
}

function validatePatch(changes) {
  if (changes === null || typeof changes !== 'object' || Array.isArray(changes)) {
    return { valid: false, message: 'No valid change was supplied.' }
  }

  const allowed = ['title', 'completed', 'priority']
  const keys = Object.keys(changes)

  if (keys.length === 0 || keys.some((key) => !allowed.includes(key))) {
    return { valid: false, message: 'No valid change was supplied.' }
  }

  const body = {}

  if ('title' in changes) {
    if (!isNonBlankString(changes.title)) {
      return { valid: false, message: 'Please enter a task title.' }
    }
    body.title = changes.title.trim()
  }

  if ('completed' in changes) {
    if (typeof changes.completed !== 'boolean') {
      return { valid: false, message: 'Completion must be true or false.' }
    }
    body.completed = changes.completed
  }

  if ('priority' in changes) {
    if (!isValidPriority(changes.priority)) {
      return { valid: false, message: 'Please choose a valid priority.' }
    }
    body.priority = changes.priority
  }

  return { valid: true, body }
}

function matchesRequestedFields(record, body) {
  return Object.entries(body).every(([key, value]) => record[key] === value)
}

async function readJson(response) {
  try {
    return { ok: true, payload: await response.json() }
  } catch {
    return {
      ok: false,
      failure: failure(
        'json',
        'The local API returned a response that could not be read.'
      ),
    }
  }
}

export async function fetchTasks(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') {
    return networkFailure()
  }

  let response

  try {
    response = await fetchImpl(TASKS_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
  } catch {
    return networkFailure()
  }

  if (!response || response.ok !== true) {
    const status = response?.status
    return failure(
      'http',
      status
        ? `The local API returned HTTP ${status}. Try again.`
        : 'The local API returned an error. Try again.'
    )
  }

  const parsed = await readJson(response)

  if (!parsed.ok) {
    return parsed.failure
  }

  const result = validateTaskList(parsed.payload)

  if (!result.valid) {
    return failure(
      'validation',
      'The local API returned task data in an unexpected format.'
    )
  }

  return { ok: true, tasks: result.tasks }
}

export async function createTask(title, priority, fetchImpl = globalThis.fetch) {
  const input = validateCreate(title, priority)

  if (!input.valid) {
    return failure('validation', input.message)
  }

  if (typeof fetchImpl !== 'function') {
    return networkFailure(true)
  }

  let response

  try {
    response = await fetchImpl(TASKS_URL, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(input.body),
    })
  } catch {
    return networkFailure(true)
  }

  if (!response || response.ok !== true) {
    const status = response?.status
    return failure(
      'http',
      status
        ? `The local API rejected the new task with HTTP ${status}.`
        : 'The local API rejected the new task.'
    )
  }

  const parsed = await readJson(response)

  if (!parsed.ok) {
    return { ...parsed.failure, uncertain: true }
  }

  const record = parsed.payload

  if (
    !validateTask(record) ||
    !matchesRequestedFields(record, input.body) ||
    !isNonBlankString(record.id)
  ) {
    return failure(
      'validation',
      'The local API returned an unexpected task after adding it.',
      true
    )
  }

  return { ok: true, task: record }
}

export async function patchTask(id, changes, fetchImpl = globalThis.fetch) {
  if (!isValidId(id)) {
    return failure('validation', 'No task was selected for this change.')
  }

  const input = validatePatch(changes)

  if (!input.valid) {
    return failure('validation', input.message)
  }

  if (typeof fetchImpl !== 'function') {
    return networkFailure(true)
  }

  let response

  try {
    response = await fetchImpl(`${TASKS_URL}/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: JSON_HEADERS,
      body: JSON.stringify(input.body),
    })
  } catch {
    return networkFailure(true)
  }

  if (!response || response.ok !== true) {
    const status = response?.status
    return failure(
      'http',
      status
        ? `The local API rejected the change with HTTP ${status}.`
        : 'The local API rejected the change.'
    )
  }

  const parsed = await readJson(response)

  if (!parsed.ok) {
    return { ...parsed.failure, uncertain: true }
  }

  const record = parsed.payload

  if (
    !validateTask(record) ||
    record.id !== id ||
    !matchesRequestedFields(record, input.body)
  ) {
    return failure(
      'validation',
      'The local API returned an unexpected task after saving the change.',
      true
    )
  }

  return { ok: true, task: record }
}

export async function deleteTask(id, fetchImpl = globalThis.fetch) {
  if (!isValidId(id)) {
    return failure('validation', 'No task was selected for deletion.')
  }

  if (typeof fetchImpl !== 'function') {
    return networkFailure(true)
  }

  let response

  try {
    response = await fetchImpl(`${TASKS_URL}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
  } catch {
    return networkFailure(true)
  }

  if (!response || response.ok !== true) {
    const status = response?.status
    return failure(
      'http',
      status
        ? `The local API rejected the deletion with HTTP ${status}.`
        : 'The local API rejected the deletion.'
    )
  }

  return { ok: true, id }
}
