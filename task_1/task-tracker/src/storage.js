export const STORAGE_KEY = 'susanoox.task-tracker.tasks.v1';

const VALID_PRIORITIES = ['low', 'medium', 'high'];

export function isValidPriority(value) {
  return VALID_PRIORITIES.includes(value);
}

export function validateTask(task) {
  if (task === null || typeof task !== 'object' || Array.isArray(task)) {
    return false;
  }

  if (typeof task.id !== 'string' || task.id.trim() === '') {
    return false;
  }

  if (typeof task.title !== 'string' || task.title.trim() === '') {
    return false;
  }

  if (typeof task.completed !== 'boolean') {
    return false;
  }

  if (!isValidPriority(task.priority)) {
    return false;
  }

  return true;
}

export function validateTaskList(value) {
  if (!Array.isArray(value)) {
    return { valid: false, reason: 'top-level value is not an array' };
  }

  const ids = new Set();

  for (const task of value) {
    if (!validateTask(task)) {
      return { valid: false, reason: 'invalid task record' };
    }

    if (ids.has(task.id)) {
      return { valid: false, reason: 'duplicate task id' };
    }

    ids.add(task.id);
  }

  return { valid: true, tasks: value };
}

export function parseAndValidateTasks(jsonText) {
  let parsed;

  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    return { valid: false, reason: 'broken JSON', parseError: error.message };
  }

  return validateTaskList(parsed);
}

export function loadTasks(storage) {
  let raw;

  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch (error) {
    return { status: 'unreadable', error: error.message };
  }

  if (raw === null) {
    return { status: 'missing' };
  }

  const result = parseAndValidateTasks(raw);

  if (result.valid) {
    return { status: 'loaded', tasks: result.tasks };
  }

  return { status: 'invalid', reason: result.reason };
}

export function saveTasks(storage, tasks) {
  const json = JSON.stringify(tasks);

  try {
    storage.setItem(STORAGE_KEY, json);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
