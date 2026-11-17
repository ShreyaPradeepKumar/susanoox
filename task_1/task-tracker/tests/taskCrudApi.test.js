import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  LOCAL_API_BASE_URL,
  TASKS_URL,
  createTask,
  deleteTask,
  fetchTasks,
  patchTask,
} from '../src/taskCrudApi.js'

const validTasks = [
  { id: 't1', title: 'Practise fetch', completed: false, priority: 'high' },
  { id: 't2', title: 'Check a failed save', completed: true, priority: 'medium' },
]

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => payload,
  }
}

function record(url, options) {
  return { url, options }
}

describe('fetchTasks', () => {
  it('requests the local API once and validates the returned list', async () => {
    const calls = []
    const result = await fetchTasks(async (url, options) => {
      calls.push(record(url, options))
      return jsonResponse(validTasks)
    })

    assert.equal(result.ok, true)
    assert.deepEqual(result.tasks, validTasks)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, TASKS_URL)
    assert.equal(calls[0].url.startsWith(LOCAL_API_BASE_URL), true)
    assert.equal(calls[0].options.method, 'GET')
    assert.deepEqual(calls[0].options.headers, { Accept: 'application/json' })
  })

  it('accepts a valid empty list', async () => {
    const result = await fetchTasks(async () => jsonResponse([]))

    assert.deepEqual(result, { ok: true, tasks: [] })
  })

  it('rejects invalid records and duplicate ids', async () => {
    const invalid = await fetchTasks(async () =>
      jsonResponse([validTasks[0], { ...validTasks[1], completed: 'true' }])
    )
    const duplicate = await fetchTasks(async () =>
      jsonResponse([validTasks[0], { ...validTasks[1], id: 't1' }])
    )

    assert.equal(invalid.ok, false)
    assert.equal(invalid.kind, 'validation')
    assert.equal(duplicate.ok, false)
    assert.equal(duplicate.kind, 'validation')
  })

  it('reports network and HTTP failures separately', async () => {
    const network = await fetchTasks(async () => {
      throw new Error('offline')
    })
    const http = await fetchTasks(async () => jsonResponse(null, { ok: false, status: 500 }))

    assert.equal(network.kind, 'network')
    assert.equal(network.uncertain, false)
    assert.equal(http.kind, 'http')
    assert.match(http.message, /500/)
  })

  it('reports unreadable JSON separately', async () => {
    const result = await fetchTasks(async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('bad json')
      },
    }))

    assert.equal(result.kind, 'json')
  })
})

describe('createTask', () => {
  it('posts a trimmed title and uses the id returned by the API', async () => {
    const created = {
      id: 'api-generated-id',
      title: 'Check POST',
      completed: false,
      priority: 'high',
    }
    const calls = []
    const result = await createTask('  Check POST  ', 'high', async (url, options) => {
      calls.push(record(url, options))
      return jsonResponse(created, { status: 201 })
    })

    assert.deepEqual(result, { ok: true, task: created })
    assert.equal(calls[0].url, TASKS_URL)
    assert.equal(calls[0].options.method, 'POST')
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      title: 'Check POST',
      completed: false,
      priority: 'high',
    })
    assert.equal(calls[0].options.headers['Content-Type'], 'application/json')
  })

  it('rejects invalid local input without a request', async () => {
    let calls = 0
    const fetchImpl = async () => {
      calls += 1
    }

    const blank = await createTask('   ', 'high', fetchImpl)
    const priority = await createTask('Valid', 'urgent', fetchImpl)

    assert.equal(blank.kind, 'validation')
    assert.equal(priority.kind, 'validation')
    assert.equal(calls, 0)
  })

  it('rejects an unexpected returned record', async () => {
    const result = await createTask('Check POST', 'high', async () =>
      jsonResponse({ id: 'x', title: 'Different', completed: false, priority: 'high' }, { status: 201 })
    )

    assert.equal(result.kind, 'validation')
    assert.equal(result.uncertain, true)
  })

  it('marks a network failure as uncertain but an HTTP rejection as definite', async () => {
    const network = await createTask('Check POST', 'high', async () => {
      throw new Error('offline')
    })
    const http = await createTask('Check POST', 'high', async () =>
      jsonResponse({}, { ok: false, status: 400 })
    )

    assert.equal(network.kind, 'network')
    assert.equal(network.uncertain, true)
    assert.equal(http.kind, 'http')
    assert.equal(http.uncertain, false)
  })
})

describe('patchTask', () => {
  it('encodes the id and uses the record returned by the API', async () => {
    const updated = {
      id: 'id with/slash',
      title: 'Check PATCH',
      completed: true,
      priority: 'low',
    }
    const calls = []
    const result = await patchTask(
      'id with/slash',
      { title: 'Check PATCH', completed: true, priority: 'low' },
      async (url, options) => {
        calls.push(record(url, options))
        return jsonResponse(updated)
      }
    )

    assert.deepEqual(result, { ok: true, task: updated })
    assert.equal(calls[0].url, `${TASKS_URL}/id%20with%2Fslash`)
    assert.equal(calls[0].options.method, 'PATCH')
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      title: 'Check PATCH',
      completed: true,
      priority: 'low',
    })
  })

  it('rejects a response whose id does not match the target', async () => {
    const result = await patchTask(
      't2',
      { completed: true },
      async () =>
        jsonResponse({ id: 'other', title: 'Check PATCH', completed: true, priority: 'low' })
    )

    assert.equal(result.kind, 'validation')
    assert.equal(result.uncertain, true)
  })

  it('rejects unsupported or invalid changes without a request', async () => {
    let calls = 0
    const fetchImpl = async () => {
      calls += 1
    }

    const unsupported = await patchTask('t2', { id: 't3' }, fetchImpl)
    const invalidPriority = await patchTask('t2', { priority: 'urgent' }, fetchImpl)

    assert.equal(unsupported.kind, 'validation')
    assert.equal(invalidPriority.kind, 'validation')
    assert.equal(calls, 0)
  })
})

describe('deleteTask', () => {
  it('sends DELETE to the encoded task URL and returns the confirmed id', async () => {
    const calls = []
    const result = await deleteTask('id/1', async (url, options) => {
      calls.push(record(url, options))
      return jsonResponse({ id: 'id/1' })
    })

    assert.deepEqual(result, { ok: true, id: 'id/1' })
    assert.equal(calls[0].url, `${TASKS_URL}/id%2F1`)
    assert.equal(calls[0].options.method, 'DELETE')
  })

  it('reports HTTP rejection and uncertain network failure', async () => {
    const http = await deleteTask('t3', async () =>
      jsonResponse({}, { ok: false, status: 500 })
    )
    const network = await deleteTask('t3', async () => {
      throw new Error('offline')
    })

    assert.equal(http.kind, 'http')
    assert.equal(http.uncertain, false)
    assert.equal(network.kind, 'network')
    assert.equal(network.uncertain, true)
  })
})
