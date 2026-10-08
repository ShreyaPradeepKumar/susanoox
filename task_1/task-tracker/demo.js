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
} from './src/tasks.js'

const sampleTasks = [
  { id: 't1', title: 'Learn React basics', completed: false, priority: 'high' },
  { id: 't2', title: 'Practise JavaScript arrays', completed: true, priority: 'medium' },
  { id: 't3', title: 'Improve mobile layout', completed: false, priority: 'low' },
  { id: 't4', title: 'Learn React basics', completed: true, priority: 'low' },
]

console.log('=== Sample data (t1 - t4) ===')
console.table(sampleTasks)
console.log('getCounts:', getCounts(sampleTasks))
console.log('expected: { total: 4, pending: 2, completed: 2 }\n')

console.log('=== addTask: with a priority, title gets trimmed ===')
let tasks = addTask(sampleTasks, '  Water the plants  ', 'high')
console.log('added:', JSON.stringify(tasks.at(-1)))
console.log('expected: title "Water the plants", priority "high", completed false\n')

console.log('=== addTask: no priority given -> medium ===')
tasks = addTask(tasks, 'Read the React docs')
console.log('added:', JSON.stringify(tasks.at(-1)))
console.log('expected: priority "medium" (the default)\n')

console.log('=== addTask: blank title is rejected, same array comes back ===')
const rejected = addTask(tasks, '     ')
console.log('same array back?', rejected === tasks, '-> expected true')
console.log('length unchanged:', tasks.length, '\n')

console.log('=== updateTask: retitle t1 and drop it to low ===')
tasks = updateTask(tasks, 't1', '  Learn React hooks  ', 'low')
console.table(tasks.filter((task) => task.id === 't1'))
console.log('expected: title "Learn React hooks", priority "low"\n')

console.log('=== updateTask: blank title is rejected too ===')
console.log('same array back?', updateTask(tasks, 't1', '   ') === tasks, '-> expected true')
console.log('unknown id is rejected too?', updateTask(tasks, 'nope', 'X') === tasks, '-> expected true\n')

console.log('=== toggleTask: t1 pending -> completed -> pending ===')
tasks = toggleTask(tasks, 't1')
console.log('after 1 toggle:', JSON.stringify(tasks.find((task) => task.id === 't1')))
tasks = toggleTask(tasks, 't1')
console.log('after 2 toggles:', JSON.stringify(tasks.find((task) => task.id === 't1')), '\n')

console.log('=== deleteTask: remove t2 ===')
tasks = deleteTask(tasks, 't2')
console.log('remaining ids:', tasks.map((task) => task.id).join(', '), '\n')

console.log('=== searchTasks: capitals make no difference ===')
console.table(searchTasks(tasks, 'REACT'))
console.log('expected: every title containing "react" — the two "Learn React basics" rows, the edited "Learn React hooks", and "Read the React docs"\n')

console.log('=== searchTasks: empty search returns the same array ===')
console.log('same array back?', searchTasks(tasks, '') === tasks, '-> expected true\n')

console.log('=== filterTasks: pending ===')
console.table(filterTasks(tasks, 'pending'))

console.log('=== filterTasks: completed ===')
console.table(filterTasks(tasks, 'completed'))

console.log('=== filterTasks: all returns the same array ===')
console.log('same array back?', filterTasks(tasks, 'all') === tasks, '-> expected true\n')

console.log('=== filterByPriority: low ===')
console.table(filterByPriority(tasks, 'low'))

console.log('=== filterByPriority: all returns the same array ===')
console.log('same array back?', filterByPriority(tasks, 'all') === tasks, '-> expected true\n')

console.log('=== sortTasks: high to low ===')
const beforeSort = tasks.map((task) => task.id)
console.table(sortTasks(tasks, 'high-to-low'))
console.log('original list untouched?', beforeSort.join(',') === tasks.map((task) => task.id).join(','), '-> expected true')
console.log('sorting back to original returns the same array?', sortTasks(tasks, 'original') === tasks, '-> expected true\n')

console.log('=== all three controls at once: pending + low + search "mobile" ===')
const byStatus = filterTasks(tasks, 'pending')
const byPriority = filterByPriority(byStatus, 'low')
const found = searchTasks(byPriority, 'mobile')
console.table(found)
console.log('expected: only "Improve mobile layout"\n')

console.log('=== getCounts always describes every task ===')
console.log('counts of the full list:', getCounts(tasks))
console.log('count of what the three controls showed:', found.length)
console.log('expected: these two numbers are allowed to differ\n')