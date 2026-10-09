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

  if (!PRIORITY_ORDER[priority]) {
    return tasks
  }

  const newTask = {
    id: crypto.randomUUID(),
    title: cleanTitle,
    completed: false,
    priority,
  }

  return [...tasks, newTask]
}

export function updateTask(tasks, id, title, priority = 'medium') {
  const cleanTitle = title.trim()

  if (cleanTitle === '') {
    return tasks
  }

  if (!PRIORITY_ORDER[priority]) {
    return tasks
  }

  if (!tasks.some((task) => task.id === id)) {
    return tasks
  }

  return tasks.map((task) => {
    if (task.id === id) {
      return { ...task, title: cleanTitle, priority }
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

export function searchTasks(tasks, query) {
  const cleanQuery = query.trim().toLowerCase()

  if (cleanQuery === '') {
    return tasks
  }

  return tasks.filter((task) => task.title.toLowerCase().includes(cleanQuery))
}

export function filterByPriority(tasks, priority) {
  if (priority === 'all') {
    return tasks
  }

  return tasks.filter((task) => task.priority === priority)
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