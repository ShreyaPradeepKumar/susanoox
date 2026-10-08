import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
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
} from '../src/tasks.js'

const sampleTasks = [
  { id: 't1', title: 'Learn React basics', completed: false, priority: 'high' },
  { id: 't2', title: 'Practise JavaScript arrays', completed: true, priority: 'medium' },
  { id: 't3', title: 'Improve mobile layout', completed: false, priority: 'low' },
  { id: 't4', title: 'Learn React basics', completed: true, priority: 'low' },
]

const scrambled = [
  { id: 'a', priority: 'low' },
  { id: 'b', priority: 'high' },
  { id: 'c', priority: 'low' },
  { id: 'd', priority: 'medium' },
]

const ids = (tasks) => tasks.map((task) => task.id)

describe('addTask', () => {
  it('adds a task with the priority you chose', () => {
    const result = addTask(sampleTasks, 'Water the plants', 'high')

    assert.equal(result.length, 5)
    assert.equal(result[4].title, 'Water the plants')
    assert.equal(result[4].priority, 'high')
    assert.equal(result[4].completed, false)
  })

  it('uses medium when no priority is given', () => {
    const result = addTask(sampleTasks, 'Water the plants')

    assert.equal(result[4].priority, 'medium')
  })

  it('trims the title', () => {
    const result = addTask(sampleTasks, '   Water the plants   ')

    assert.equal(result[4].title, 'Water the plants')
  })

  it('rejects a blank title by returning the same array', () => {
    assert.strictEqual(addTask(sampleTasks, ''), sampleTasks)
    assert.strictEqual(addTask(sampleTasks, '     '), sampleTasks)
  })

  it('leaves the list it was given untouched', () => {
    addTask(sampleTasks, 'Water the plants', 'high')

    assert.equal(sampleTasks.length, 4)
    assert.equal(sampleTasks[0].title, 'Learn React basics')
  })
})

describe('updateTask', () => {
  it('changes the title and priority of one task', () => {
    const result = updateTask(sampleTasks, 't1', '  Learn React hooks  ', 'low')

    assert.equal(result.length, 4)
    assert.equal(result[0].title, 'Learn React hooks')
    assert.equal(result[0].priority, 'low')
  })

  it('leaves every other task exactly as it was', () => {
    const result = updateTask(sampleTasks, 't1', 'Learn React hooks', 'low')

    assert.strictEqual(result[1], sampleTasks[1])
    assert.strictEqual(result[2], sampleTasks[2])
    assert.strictEqual(result[3], sampleTasks[3])
  })

  it('rejects a blank title by returning the same array', () => {
    assert.strictEqual(updateTask(sampleTasks, 't1', '   ', 'high'), sampleTasks)
  })

  it('returns the same array when the id does not exist', () => {
    assert.strictEqual(updateTask(sampleTasks, 'nope', 'Something', 'high'), sampleTasks)
  })
})

describe('deleteTask', () => {
  it('removes only the matching task', () => {
    const result = deleteTask(sampleTasks, 't1')

    assert.deepEqual(ids(result), ['t2', 't3', 't4'])
  })

  it('leaves the list it was given untouched', () => {
    deleteTask(sampleTasks, 't1')

    assert.equal(sampleTasks.length, 4)
  })
})

describe('toggleTask', () => {
  it('flips a pending task to completed', () => {
    const result = toggleTask(sampleTasks, 't1')

    assert.equal(result[0].completed, true)
  })

  it('flips a completed task back to pending', () => {
    const result = toggleTask(sampleTasks, 't2')

    assert.equal(result[1].completed, false)
  })

  it('leaves every other task exactly as it was', () => {
    const result = toggleTask(sampleTasks, 't1')

    assert.strictEqual(result[1], sampleTasks[1])
    assert.strictEqual(result[2], sampleTasks[2])
    assert.strictEqual(result[3], sampleTasks[3])
  })
})

describe('filterTasks', () => {
  it('returns the pending tasks', () => {
    assert.deepEqual(ids(filterTasks(sampleTasks, 'pending')), ['t1', 't3'])
  })

  it('returns the completed tasks', () => {
    assert.deepEqual(ids(filterTasks(sampleTasks, 'completed')), ['t2', 't4'])
  })

  it('returns the same array for all', () => {
    assert.strictEqual(filterTasks(sampleTasks, 'all'), sampleTasks)
  })
})

describe('searchTasks', () => {
  it('finds matches regardless of capital letters', () => {
    assert.deepEqual(ids(searchTasks(sampleTasks, 'react')), ['t1', 't4'])
    assert.deepEqual(ids(searchTasks(sampleTasks, 'REACT')), ['t1', 't4'])
  })

  it('ignores spaces around what you typed', () => {
    assert.deepEqual(ids(searchTasks(sampleTasks, '  arrays  ')), ['t2'])
  })

  it('returns the same array for an empty search', () => {
    assert.strictEqual(searchTasks(sampleTasks, ''), sampleTasks)
    assert.strictEqual(searchTasks(sampleTasks, '   '), sampleTasks)
  })

  it('returns an empty list when nothing matches', () => {
    assert.deepEqual(searchTasks(sampleTasks, 'gardening'), [])
  })
})

describe('filterByPriority', () => {
  it('returns only the high priority tasks', () => {
    assert.deepEqual(ids(filterByPriority(sampleTasks, 'high')), ['t1'])
  })

  it('returns only the medium priority tasks', () => {
    assert.deepEqual(ids(filterByPriority(sampleTasks, 'medium')), ['t2'])
  })

  it('returns only the low priority tasks', () => {
    assert.deepEqual(ids(filterByPriority(sampleTasks, 'low')), ['t3', 't4'])
  })

  it('returns the same array for all', () => {
    assert.strictEqual(filterByPriority(sampleTasks, 'all'), sampleTasks)
  })
})

describe('sortTasks', () => {
  it('puts high priority first', () => {
    const sorted = sortTasks(scrambled, 'high-to-low')

    assert.deepEqual(ids(sorted), ['b', 'd', 'a', 'c'])
  })

  it('keeps tasks of equal priority in their original order', () => {
    const sorted = sortTasks(scrambled, 'high-to-low')

    assert.deepEqual(ids(sorted).slice(2), ['a', 'c'])
  })

  it('does not change the list it was given', () => {
    const before = structuredClone(scrambled)

    sortTasks(scrambled, 'high-to-low')

    assert.deepEqual(scrambled, before)
  })

  it('returns the same array for original order', () => {
    assert.strictEqual(sortTasks(scrambled, 'original'), scrambled)
  })
})

describe('getCounts', () => {
  it('counts an empty list as zeros', () => {
    assert.deepEqual(getCounts([]), { total: 0, pending: 0, completed: 0 })
  })

  it('counts the four sample tasks', () => {
    assert.deepEqual(getCounts(sampleTasks), { total: 4, pending: 2, completed: 2 })
  })
})

describe('using them together', () => {
  it('applies the status filter, the priority filter and the search', () => {
    const byStatus = filterTasks(sampleTasks, 'pending')
    const byPriority = filterByPriority(byStatus, 'low')
    const found = searchTasks(byPriority, 'mobile')

    assert.deepEqual(ids(found), ['t3'])
  })

  it('keeps counts describing every task even when search hides them all', () => {
    const hidden = searchTasks(sampleTasks, 'gardening')

    assert.equal(getCounts(sampleTasks).total, 4)
    assert.equal(hidden.length, 0)
  })
})