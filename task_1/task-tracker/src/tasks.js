const PRIORITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
}

export function addTask(tasks, title, priority = 'medium') {
  const cleanTitle = title.trim()

  if (cleanTitle === '') {
    return tasks
  }

  const validPriority = PRIORITY_ORDER[priority] ? priority : 'medium'

  const newTask = {
    id: crypto.randomUUID(),
    title: cleanTitle,
    completed: false,
    priority: validPriority,
  }

  return [...tasks, newTask]
}

export function updateTask(tasks, id, title, priority = 'medium') {
  const cleanTitle = title.trim()

  if (cleanTitle === '') {
    return tasks
  }

  const validPriority = PRIORITY_ORDER[priority] ? priority : 'medium'

  if (!tasks.some((task) => task.id === id)) {
    return tasks
  }

  return tasks.map((task) => {
    if (task.id === id) {
      return { ...task, title: cleanTitle, priority: validPriority }
    }
    return task
  })
}

export function deleteTask(tasks, id) {
  return tasks.filter((task) => task.id !== id)
}

export function toggleTask(tasks, id) {
  return tasks.map((task) => {
    if (task.id === id) {
      return { ...task, completed: !task.completed }
    }
    return task
  })
}

export function filterTasks(tasks, status) {
  if (status === 'pending') {
    return tasks.filter((task) => !task.completed)
  }

  if (status === 'completed') {
    return tasks.filter((task) => task.completed)
  }

  return tasks
}

export function getCounts(tasks) {
  return {
    total: tasks.length,
    pending: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
  }
}

export function sortTasks(tasks, order) {
  if (order !== 'high-to-low') {
    return tasks
  }

  return [...tasks].sort(
    (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
  )
}