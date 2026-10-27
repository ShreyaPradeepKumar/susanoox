import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  STORAGE_KEY,
  isValidPriority,
  validateTask,
  validateTaskList,
  parseAndValidateTasks,
  loadTasks,
  saveTasks,
} from '../src/storage.js'

const sampleTasks = [
  { id: 't1', title: 'Learn React basics', completed: false, priority: 'high' },
  { id: 't2', title: 'Practise JavaScript arrays', completed: true, priority: 'medium' },
  { id: 't3', title: 'Improve mobile layout', completed: false, priority: 'low' },
  { id: 't4', title: 'Learn React basics', completed: true, priority: 'low' },
]

describe('storage key', () => {
  it('is the application-specific key with no surrounding spaces', () => {
    assert.equal(STORAGE_KEY, 'susanoox.task-tracker.tasks.v1')
  })
})

describe('JSON round trip', () => {
  it('converts a sample task array to a JSON string and back unchanged', () => {
    const json = JSON.stringify(sampleTasks)

    assert.equal(typeof json, 'string')

    const parsed = JSON.parse(json)

    assert.deepEqual(parsed, sampleTasks)
    assert.equal(parsed.length, 4)
    assert.equal(parsed[0].id, 't1')
    assert.equal(parsed[3].id, 't4')
    assert.equal(parsed[0].priority, 'high')
    assert.equal(parsed[1].completed, true)
  })

  it('round trip preserves original order and IDs', () => {
    const json = JSON.stringify(sampleTasks)
    const parsed = JSON.parse(json)

    const ids = parsed.map((task) => task.id)
    assert.deepEqual(ids, ['t1', 't2', 't3', 't4'])
  })
})

describe('isValidPriority', () => {
  it('accepts low, medium and high', () => {
    assert.equal(isValidPriority('low'), true)
    assert.equal(isValidPriority('medium'), true)
    assert.equal(isValidPriority('high'), true)
  })

  it('rejects invalid priorities including prototype keys', () => {
    assert.equal(isValidPriority('urgent'), false)
    assert.equal(isValidPriority('constructor'), false)
    assert.equal(isValidPriority('toString'), false)
    assert.equal(isValidPriority('__proto__'), false)
    assert.equal(isValidPriority('Low'), false)
    assert.equal(isValidPriority(null), false)
    assert.equal(isValidPriority(undefined), false)
  })
})

describe('validateTask', () => {
  it('accepts a valid task', () => {
    assert.equal(validateTask({ id: 't1', title: 'Buy milk', completed: false, priority: 'high' }), true)
  })

  it('rejects null', () => {
    assert.equal(validateTask(null), false)
  })

  it('rejects an array instead of an object', () => {
    assert.equal(validateTask(['t1', 'Buy milk']), false)
  })

  it('rejects a missing id', () => {
    assert.equal(validateTask({ title: 'Buy milk', completed: false, priority: 'high' }), false)
  })

  it('rejects an empty id', () => {
    assert.equal(validateTask({ id: '', title: 'Buy milk', completed: false, priority: 'high' }), false)
  })

  it('rejects a non-string id', () => {
    assert.equal(validateTask({ id: 123, title: 'Buy milk', completed: false, priority: 'high' }), false)
  })

  it('rejects a missing title', () => {
    assert.equal(validateTask({ id: 't1', completed: false, priority: 'high' }), false)
  })

  it('rejects a whitespace-only title', () => {
    assert.equal(validateTask({ id: 't1', title: '   ', completed: false, priority: 'high' }), false)
  })

  it('rejects completed as a string', () => {
    assert.equal(validateTask({ id: 't1', title: 'Buy milk', completed: 'false', priority: 'high' }), false)
  })

  it('rejects an invalid priority', () => {
    assert.equal(validateTask({ id: 't1', title: 'Buy milk', completed: false, priority: 'urgent' }), false)
  })

  it('rejects prototype-key priorities', () => {
    assert.equal(validateTask({ id: 't1', title: 'Buy milk', completed: false, priority: 'constructor' }), false)
    assert.equal(validateTask({ id: 't1', title: 'Buy milk', completed: false, priority: 'toString' }), false)
    assert.equal(validateTask({ id: 't1', title: 'Buy milk', completed: false, priority: '__proto__' }), false)
  })
})

describe('validateTaskList', () => {
  it('accepts a valid list of tasks', () => {
    const result = validateTaskList(sampleTasks)

    assert.equal(result.valid, true)
    assert.deepEqual(result.tasks, sampleTasks)
  })

  it('accepts an empty array as a valid saved list', () => {
    const result = validateTaskList([])

    assert.equal(result.valid, true)
    assert.deepEqual(result.tasks, [])
  })

  it('rejects a non-array top-level value', () => {
    const result = validateTaskList(null)

    assert.equal(result.valid, false)
    assert.equal(result.reason, 'top-level value is not an array')
  })

  it('rejects an object instead of an array', () => {
    const result = validateTaskList({ id: 't1' })

    assert.equal(result.valid, false)
  })

  it('rejects a string instead of an array', () => {
    const result = validateTaskList('not an array')

    assert.equal(result.valid, false)
  })

  it('rejects a list with an invalid task record', () => {
    const bad = [...sampleTasks, { id: 't5', title: '', completed: false, priority: 'high' }]

    const result = validateTaskList(bad)

    assert.equal(result.valid, false)
  })

  it('rejects a list with duplicate IDs', () => {
    const dup = [...sampleTasks, { id: 't1', title: 'Duplicate', completed: false, priority: 'low' }]

    const result = validateTaskList(dup)

    assert.equal(result.valid, false)
    assert.equal(result.reason, 'duplicate task id')
  })

  it('rejects a list with an invalid priority', () => {
    const bad = [...sampleTasks, { id: 't5', title: 'Walk dog', completed: false, priority: 'urgent' }]

    const result = validateTaskList(bad)

    assert.equal(result.valid, false)
  })
})

describe('parseAndValidateTasks', () => {
  it('parses valid JSON and validates a good task list', () => {
    const json = JSON.stringify(sampleTasks)

    const result = parseAndValidateTasks(json)

    assert.equal(result.valid, true)
    assert.deepEqual(result.tasks, sampleTasks)
  })

  it('accepts a JSON empty array', () => {
    const result = parseAndValidateTasks('[]')

    assert.equal(result.valid, true)
    assert.deepEqual(result.tasks, [])
  })

  it('rejects broken JSON', () => {
    const result = parseAndValidateTasks('{not valid json')

    assert.equal(result.valid, false)
    assert.equal(result.reason, 'broken JSON')
    assert.equal(typeof result.parseError, 'string')
    assert.ok(result.parseError.length > 0)
  })

  it('rejects valid JSON that is not a task list', () => {
    const result = parseAndValidateTasks('{"id": "t1"}')

    assert.equal(result.valid, false)
    assert.equal(result.reason, 'top-level value is not an array')
  })

  it('rejects valid JSON with invalid task records', () => {
    const json = JSON.stringify([
      { id: 't1', title: 'Buy milk', completed: false, priority: 'high' },
      { id: 't2', title: '', completed: 'false', priority: 'urgent' },
    ])

    const result = parseAndValidateTasks(json)

    assert.equal(result.valid, false)
  })

  it('rejects valid JSON with duplicate IDs', () => {
    const json = JSON.stringify([
      { id: 't1', title: 'First', completed: false, priority: 'low' },
      { id: 't1', title: 'Second', completed: false, priority: 'low' },
    ])

    const result = parseAndValidateTasks(json)

    assert.equal(result.valid, false)
    assert.equal(result.reason, 'duplicate task id')
  })

  it('rejects valid JSON with prototype-key priorities', () => {
    const json = JSON.stringify([
      { id: 't1', title: 'Buy milk', completed: false, priority: 'constructor' },
    ])

    const result = parseAndValidateTasks(json)

    assert.equal(result.valid, false)
  })
})

describe('loadTasks', () => {
  const missingStorage = { getItem: () => null, setItem: () => {} }

  it('returns missing when the key does not exist', () => {
    const result = loadTasks(missingStorage)

    assert.equal(result.status, 'missing')
  })

  it('returns loaded with tasks when valid JSON exists', () => {
    const json = JSON.stringify(sampleTasks)
    const storage = { getItem: () => json, setItem: () => {} }

    const result = loadTasks(storage)

    assert.equal(result.status, 'loaded')
    assert.deepEqual(result.tasks, sampleTasks)
  })

  it('returns loaded with an empty array when [] is saved', () => {
    const storage = { getItem: () => '[]', setItem: () => {} }

    const result = loadTasks(storage)

    assert.equal(result.status, 'loaded')
    assert.deepEqual(result.tasks, [])
  })

  it('returns invalid for broken JSON', () => {
    const storage = { getItem: () => '{not valid json', setItem: () => {} }

    const result = loadTasks(storage)

    assert.equal(result.status, 'invalid')
  })

  it('returns invalid for valid JSON with bad records', () => {
    const json = JSON.stringify([
      { id: 't1', title: 'Buy milk', completed: false, priority: 'urgent' },
    ])
    const storage = { getItem: () => json, setItem: () => {} }

    const result = loadTasks(storage)

    assert.equal(result.status, 'invalid')
  })

  it('returns invalid for a non-array top-level value', () => {
    const storage = { getItem: () => '{"id": "t1"}', setItem: () => {} }

    const result = loadTasks(storage)

    assert.equal(result.status, 'invalid')
  })

  it('returns invalid for duplicate IDs', () => {
    const json = JSON.stringify([
      { id: 't1', title: 'First', completed: false, priority: 'low' },
      { id: 't1', title: 'Second', completed: false, priority: 'low' },
    ])
    const storage = { getItem: () => json, setItem: () => {} }

    const result = loadTasks(storage)

    assert.equal(result.status, 'invalid')
  })

  it('returns unreadable when getItem throws', () => {
    const storage = {
      getItem: () => {
        throw new Error('storage blocked')
      },
      setItem: () => {},
    }

    const result = loadTasks(storage)

    assert.equal(result.status, 'unreadable')
    assert.equal(result.error, 'storage blocked')
  })
})

describe('saveTasks', () => {
  it('returns success when writing works', () => {
    const stored = {}
    const storage = {
      getItem: () => null,
      setItem: (key, value) => {
        stored[key] = value
      },
    }

    const result = saveTasks(storage, sampleTasks)

    assert.equal(result.success, true)
    assert.equal(stored[STORAGE_KEY], JSON.stringify(sampleTasks))
  })

  it('returns failure when setItem throws', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('storage full')
      },
    }

    const result = saveTasks(storage, sampleTasks)

    assert.equal(result.success, false)
    assert.equal(result.error, 'storage full')
  })

  it('only touches our storage key', () => {
    const stored = { otherKey: 'some-value' }
    const storage = {
      getItem: (key) => stored[key],
      setItem: (key, value) => {
        stored[key] = value
      },
    }

    saveTasks(storage, sampleTasks)

    assert.equal(stored.otherKey, 'some-value')
    assert.equal(stored[STORAGE_KEY], JSON.stringify(sampleTasks))
  })
})
