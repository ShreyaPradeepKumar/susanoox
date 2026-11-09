import { DEFAULT_PRIORITY } from './priority.js'

export const SAMPLE_TASKS_URL =
  'https://jsonplaceholder.typicode.com/todos?_limit=5'

export const IMPORT_ID_PREFIX = 'jsonplaceholder-todo-'

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0
}

export function validateApiTodo(record) {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    return { valid: false, reason: 'record is not an object' }
  }

  if (!isPositiveSafeInteger(record.id)) {
    return { valid: false, reason: 'id is not a positive safe integer' }
  }

  if (!isPositiveSafeInteger(record.userId)) {
    return { valid: false, reason: 'userId is not a positive safe integer' }
  }

  if (typeof record.title !== 'string' || record.title.trim() === '') {
    return { valid: false, reason: 'title is not a non-blank string' }
  }

  if (typeof record.completed !== 'boolean') {
    return { valid: false, reason: 'completed is not a boolean' }
  }

  return { valid: true }
}

export function convertApiTodo(record) {
  return {
    id: `${IMPORT_ID_PREFIX}${record.id}`,
    title: record.title.trim(),
    completed: record.completed,
    priority: DEFAULT_PRIORITY,
  }
}

export function validateAndConvertApiTodos(payload) {
  if (!Array.isArray(payload)) {
    return { valid: false, reason: 'response is not an array' }
  }

  const ids = new Set()
  const tasks = []

  for (const record of payload) {
    const result = validateApiTodo(record)

    if (!result.valid) {
      return result
    }

    if (ids.has(record.id)) {
      return { valid: false, reason: 'duplicate id in response' }
    }

    ids.add(record.id)
    tasks.push(convertApiTodo(record))
  }

  return { valid: true, tasks }
}

function failure(kind, message) {
  return { ok: false, kind, message }
}

export async function requestSampleTasks(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') {
    return failure(
      'network',
      'Could not reach the sample task service. Check your connection and try again.'
    )
  }

  let response

  try {
    response = await fetchImpl(SAMPLE_TASKS_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
  } catch {
    return failure(
      'network',
      'Could not reach the sample task service. Check your connection and try again.'
    )
  }

  if (!response || response.ok !== true) {
    const status = response?.status
    return failure(
      'http',
      status
        ? `The sample task service returned HTTP ${status}. Try again.`
        : 'The sample task service returned an error. Try again.'
    )
  }

  let payload

  try {
    payload = await response.json()
  } catch {
    return failure(
      'json',
      'The sample task service returned a response that could not be read. Try again.'
    )
  }

  const result = validateAndConvertApiTodos(payload)

  if (!result.valid) {
    return failure(
      'validation',
      'The sample task service returned task data in an unexpected format. Try again.'
    )
  }

  return { ok: true, tasks: result.tasks }
}
