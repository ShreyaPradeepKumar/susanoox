import { isValidPriority } from './priority.js'

export { isValidPriority }

export const STORAGE_KEY = 'susanoox.task-tracker.tasks.v1';

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

export function getBrowserStorage() {
  try {
    const storage = globalThis.localStorage;

    if (!storage) {
      return { storage: null, error: 'Browser storage is not available.' };
    }

    return { storage, error: null };
  } catch (error) {
    return {
      storage: null,
      error: error?.message || 'Browser storage access is blocked.',
    };
  }
}

export function loadTasksFromBrowser(getStorage = getBrowserStorage) {
  let access;

  try {
    access = getStorage();
  } catch (error) {
    return {
      status: 'unreadable',
      error: error?.message || 'Browser storage access is blocked.',
    };
  }

  if (!access?.storage) {
    return {
      status: 'unreadable',
      error: access?.error || 'Browser storage is not available.',
    };
  }

  return loadTasks(access.storage);
}

export function saveTasksToBrowser(tasks, getStorage = getBrowserStorage) {
  let access;

  try {
    access = getStorage();
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Browser storage access is blocked.',
    };
  }

  if (!access?.storage) {
    return {
      success: false,
      error: access?.error || 'Browser storage is not available.',
    };
  }

  return saveTasks(access.storage, tasks);
}

export function loadTasks(storage) {
  let raw;

  try {
    if (!storage || typeof storage.getItem !== 'function') {
      throw new Error('Browser storage is not available.');
    }

    raw = storage.getItem(STORAGE_KEY);
  } catch (error) {
    return {
      status: 'unreadable',
      error: error?.message || 'Browser storage is not available.',
    };
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
  try {
    if (!storage || typeof storage.setItem !== 'function') {
      throw new Error('Browser storage is not available.');
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error?.message || 'Browser storage is not available.',
    };
  }
}
