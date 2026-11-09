import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  IMPORT_ID_PREFIX,
  SAMPLE_TASKS_URL,
  convertApiTodo,
  requestSampleTasks,
  validateAndConvertApiTodos,
  validateApiTodo,
} from '../src/taskApi.js'

const validPayload = [
  {
    userId: 1,
    id: 1,
    title: 'delectus aut autem',
    completed: false,
  },
  {
    userId: 1,
    id: 2,
    title: '  quis ut nam facilis et officia qui  ',
    completed: true,
  },
]

function invalidRecord(overrides) {
  return { userId: 1, id: 1, title: 'Valid title', completed: false, ...overrides }
}

describe('validateApiTodo', () => {
  it('accepts a valid record and ignores extra fields', () => {
    const result = validateApiTodo({ ...validPayload[0], extra: 'ignored' })

    assert.equal(result.valid, true)
  })

  it('rejects a null entry', () => {
    assert.equal(validateApiTodo(null).valid, false)
  })

  it('rejects an array entry', () => {
    assert.equal(validateApiTodo([]).valid, false)
  })

  it('rejects id values that are not positive safe integers', () => {
    for (const id of [0, -1, 1.5, '1', Number.MAX_SAFE_INTEGER + 1]) {
      assert.equal(validateApiTodo(invalidRecord({ id })).valid, false)
    }
  })

  it('rejects userId values that are not positive safe integers', () => {
    for (const userId of [0, -1, 1.5, '1', Number.MAX_SAFE_INTEGER + 1]) {
      assert.equal(validateApiTodo(invalidRecord({ userId })).valid, false)
    }
  })

  it('rejects blank and non-string titles', () => {
    for (const title of ['', '   ', 42, null, undefined]) {
      assert.equal(validateApiTodo(invalidRecord({ title })).valid, false)
    }
  })

  it('rejects completed values that are not booleans', () => {
    for (const completed of ['false', 0, 1, null, undefined]) {
      assert.equal(validateApiTodo(invalidRecord({ completed })).valid, false)
    }
  })
})

describe('convertApiTodo', () => {
  it('uses a stable prefixed id, trims the title, keeps completion, and assigns Medium', () => {
    const task = convertApiTodo(validPayload[1])

    assert.deepEqual(task, {
      id: `${IMPORT_ID_PREFIX}2`,
      title: 'quis ut nam facilis et officia qui',
      completed: true,
      priority: 'medium',
    })
    assert.equal('userId' in task, false)
  })

  it('does not copy arbitrary response fields', () => {
    const task = convertApiTodo({ ...validPayload[0], extra: 'ignored' })

    assert.deepEqual(Object.keys(task).sort(), [
      'completed',
      'id',
      'priority',
      'title',
    ])
  })
})

describe('validateAndConvertApiTodos', () => {
  it('accepts an empty array', () => {
    assert.deepEqual(validateAndConvertApiTodos([]), { valid: true, tasks: [] })
  })

  it('converts a valid response in order', () => {
    const result = validateAndConvertApiTodos(validPayload)

    assert.equal(result.valid, true)
    assert.deepEqual(result.tasks.map((task) => task.id), [
      'jsonplaceholder-todo-1',
      'jsonplaceholder-todo-2',
    ])
  })

  it('rejects a non-array top-level value', () => {
    for (const payload of [null, undefined, {}, '[]', 5]) {
      assert.equal(validateAndConvertApiTodos(payload).valid, false)
    }
  })

  it('rejects duplicate ids within the response', () => {
    const result = validateAndConvertApiTodos([
      validPayload[0],
      { ...validPayload[1], id: 1 },
    ])

    assert.equal(result.valid, false)
    assert.equal(result.reason, 'duplicate id in response')
  })

  it('rejects the whole response when one record is invalid', () => {
    const result = validateAndConvertApiTodos([
      validPayload[0],
      { ...validPayload[1], completed: 'true' },
    ])

    assert.equal(result.valid, false)
  })
})

describe('requestSampleTasks', () => {
  it('sends one GET request to the practice endpoint and returns converted tasks', async () => {
    const calls = []
    const fetchImpl = async (url, options) => {
      calls.push({ url, options })
      return { ok: true, status: 200, json: async () => validPayload }
    }

    const result = await requestSampleTasks(fetchImpl)

    assert.equal(result.ok, true)
    assert.equal(result.tasks.length, 2)
    assert.deepEqual(result.tasks[0], {
      id: 'jsonplaceholder-todo-1',
      title: 'delectus aut autem',
      completed: false,
      priority: 'medium',
    })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, SAMPLE_TASKS_URL)
    assert.equal(calls[0].options.method, 'GET')
  })

  it('reports a network failure without retrying automatically', async () => {
    let calls = 0
    const fetchImpl = async () => {
      calls += 1
      throw new Error('network down')
    }

    const result = await requestSampleTasks(fetchImpl)

    assert.equal(result.ok, false)
    assert.equal(result.kind, 'network')
    assert.equal(calls, 1)
    assert.equal(typeof result.message, 'string')
  })

  it('reports a non-success HTTP status', async () => {
    const fetchImpl = async () => ({ ok: false, status: 500 })

    const result = await requestSampleTasks(fetchImpl)

    assert.equal(result.ok, false)
    assert.equal(result.kind, 'http')
    assert.match(result.message, /500/)
  })

  it('reports invalid JSON separately', async () => {
    const fetchImpl = async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('bad json')
      },
    })

    const result = await requestSampleTasks(fetchImpl)

    assert.equal(result.ok, false)
    assert.equal(result.kind, 'json')
  })

  it('reports invalid response structure separately', async () => {
    const fetchImpl = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ not: 'an array' }),
    })

    const result = await requestSampleTasks(fetchImpl)

    assert.equal(result.ok, false)
    assert.equal(result.kind, 'validation')
  })

  it('reports a network failure when fetch is unavailable', async () => {
    const result = await requestSampleTasks(null)

    assert.equal(result.ok, false)
    assert.equal(result.kind, 'network')
  })
})
