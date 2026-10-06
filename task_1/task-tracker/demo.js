import { addTask, deleteTask, filterTasks, getCounts, toggleTask } from './src/tasks.js'

let tasks = [
  { id: 'a1', title: 'Practise JavaScript arrays', completed: false },
  { id: 'a2', title: 'Build the task tracker UI', completed: true },
  { id: 'a3', title: 'Practise JavaScript arrays', completed: false },
]

console.log('=== Sample data ===')
console.table(tasks)

console.log('=== addTask: adds a task and trims the title ===')
tasks = addTask(tasks, '   Learn about useState   ')
console.table(tasks)

console.log('=== addTask: a blank title is rejected, list unchanged ===')
tasks = addTask(tasks, '     ')
console.log('Number of tasks is still', tasks.length)

console.log('=== toggleTask: a1 goes pending -> completed -> pending ===')
tasks = toggleTask(tasks, 'a1')
console.log('after 1 toggle: ', tasks.find((task) => task.id === 'a1'))
tasks = toggleTask(tasks, 'a1')
console.log('after 2 toggles:', tasks.find((task) => task.id === 'a1'))

console.log('=== Identical titles stay independent (toggle a1 only) ===')
tasks = toggleTask(tasks, 'a1')
console.table(tasks.filter((task) => task.title === 'Practise JavaScript arrays'))

console.log('=== deleteTask: removes only a2 ===')
tasks = deleteTask(tasks, 'a2')
console.table(tasks)

console.log('=== filterTasks: pending ===')
console.table(filterTasks(tasks, 'pending'))

console.log('=== filterTasks: completed ===')
console.table(filterTasks(tasks, 'completed'))

console.log('=== filterTasks: all ===')
console.table(filterTasks(tasks, 'all'))

console.log('=== getCounts ===')
console.log(getCounts(tasks))