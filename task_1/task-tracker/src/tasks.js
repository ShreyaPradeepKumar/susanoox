export function addTask(tasks, title) {
  const cleanTitle = title.trim();

  if (cleanTitle === '') {
    return tasks;
  }

  const newTask = {
    id: crypto.randomUUID(),
    title: cleanTitle,
    completed: false,
  };

  return [...tasks, newTask];
}

export function deleteTask(tasks, id) {
  return tasks.filter((task) => task.id !== id);
}

export function toggleTask(tasks, id) {
  return tasks.map((task) => {
    if (task.id === id) {
      return { ...task, completed: !task.completed };
    }
    return task;
  });
}

export function filterTasks(tasks, status) {
  if (status === 'pending') {
    return tasks.filter((task) => !task.completed);
  }

  if (status === 'completed') {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

export function getCounts(tasks) {
  return {
    total: tasks.length,
    pending: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
  };
}