# Task Tracker

A task tracker built with React, JavaScript, and Tailwind CSS. Add tasks, assign priorities (Low, Medium, High), toggle completion, edit tasks in place, and filter or sort the list with instant search, status filters, priority filters, and priority sorting.

In Task 03, browser persistence via `localStorage` was added: saved tasks, completion status, priorities, and original list order survive page refreshes and browser restarts within the same browser profile.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5173/susanoox/ in your browser.

(`npm install` only needs running once. To stop the dev server, press `Ctrl + C` in the terminal running it. The `/susanoox/` path comes from the `base` setting in `vite.config.js` — the app is deployed under that path on GitHub Pages.)

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local Vite development server |
| `npm test` | Run test suites in `tests/tasks.test.js` and `tests/storage.test.js` |
| `npm run demo` | Print a demonstration run-through of the nine task functions |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Preview the local production build |
| `npm run lint` | Check code using oxlint |

## How it fits together

### State Ownership in `App.jsx`

`App.jsx` owns the application state:

| State | Purpose | Persisted? |
| --- | --- | --- |
| `tasks` | Canonical array of task records (source of truth) | Yes (`localStorage`) |
| `temporaryMode` | Boolean flag set when stored data is invalid or unreadable | No (computed on startup) |
| `saveError` | Error message string when writing to storage fails, else `null` | No (runtime state) |
| `title`, `priority` | Add-task form input and priority selection (defaults to `medium`) | No |
| `error` | Validation error message for the add-task form | No |
| `editingId`, `draftTitle`, `draftPriority`, `editError` | In-place editor state and validation draft | No |
| `search`, `filter`, `priorityFilter`, `sort` | Active view filters and sort order | No (defaults on startup) |

Data flows downward through props and upward through event callbacks. View controls (search, filter, priority filter, sort) do **not** mutate or create copies of the stored tasks; they derive visible tasks dynamically on each render.

### Task Logic (`src/tasks.js`)

Plain JavaScript helper functions handle pure data operations:

| Function | Purpose |
| --- | --- |
| `addTask(tasks, title, priority)` | Appends a task with a trimmed title, UUID, and priority (defaults to `'medium'`). Rejects blank titles or invalid priorities. |
| `updateTask(tasks, id, title, priority)` | Updates title and priority of a specific task by ID. Preserves task ID and completion status. |
| `deleteTask(tasks, id)` | Removes the task matching the specified ID. |
| `toggleTask(tasks, id)` | Flips `completed` between `true` and `false`. |
| `filterTasks(tasks, status)` | Filters by status (`'all'`, `'pending'`, `'completed'`). |
| `searchTasks(tasks, query)` | Case-insensitive title search ignoring leading/trailing spaces. |
| `filterByPriority(tasks, priority)` | Filters by priority (`'all'`, `'low'`, `'medium'`, `'high'`). |
| `sortTasks(tasks, order)` | Returns a priority-sorted copy (`'high-to-low'`) or original list (`'original'`). |
| `getCounts(tasks)` | Computes `{ total, pending, completed }` across the **entire** task array. |
| `isValidPriority(value)` | Strictly validates allowed priority strings (`'low'`, `'medium'`, `'high'`). |

All task functions are immutable: valid changes return a **new** array, while rejected operations return the original array reference unchanged.

### Storage Architecture (`src/storage.js`)

All persistence logic is encapsulated in `src/storage.js`:

- **Storage Key**: `susanoox.task-tracker.tasks.v1`
- **Stored Format**: JSON array of task objects (`[{ id, title, completed, priority }]`).
- **Validation Rules**:
  - Top-level value must be an array.
  - Every entry must be a non-null object.
  - `id` must be a non-empty string, and all IDs must be unique.
  - `title` must be a non-empty string with non-whitespace content.
  - `completed` must be a boolean.
  - `priority` must be strictly `'low'`, `'medium'`, or `'high'`.
- **Loading Outcomes**:
  - `missing`: The key does not exist. App initializes with sample tasks and saves them.
  - `loaded`: Valid task array parsed (including valid empty array `[]`). App initializes with those tasks.
  - `invalid`: Broken JSON or invalid record structure. Existing storage is untouched; app starts in temporary mode with `[]`.
  - `unreadable`: Storage read threw an error (e.g. security blocked). Storage is untouched; app starts in temporary mode with `[]`.
- **Saving Operations**:
  - `saveTasks(storage, tasks)`: Serializes tasks to JSON and writes to `STORAGE_KEY`. Reports `{ success: true }` or `{ success: false, error }`. Only accesses `STORAGE_KEY`.

## Storage Behavior and Recovery

1. **First Visit**: When no saved data exists, the application loads four initial sample tasks and persists them to `localStorage`.
2. **Refresh & Restorations**: On subsequent visits, previously saved tasks (including an empty list `[]` after deleting all tasks) are restored without re-inserting sample data.
3. **Invalid or Unreadable Data**:
   - If corrupted JSON, schema violations, or duplicate IDs are detected, the stored data is preserved untouched.
   - The app starts with an empty temporary list and displays a warning banner explaining that changes are temporary.
   - Automatic saving is suspended to protect the existing stored content.
   - The user can click **Replace saved data with current tasks** (prompting a confirmation) to explicitly overwrite storage with their current in-memory tasks and resume auto-saving.
4. **Save Failures**:
   - If writing to `localStorage` fails (e.g. quota exceeded or storage disabled), the in-memory task state remains fully usable.
   - A warning banner alerts the user that changes could not be saved and offers a **Retry saving** button that re-attempts saving the latest full task list.

## Browser Storage Limitations

- **Browser Profile and Origin Isolation**: Saved tasks are tied to the specific browser profile and site origin (`protocol + domain + port`). Tasks saved on GitHub Pages are not shared with the local Vite development site (`localhost`), another browser, another browser profile, or another device.
- **No Cloud Synchronization**: There is no backend database or cloud account synchronization.
- **Multiple Tabs**: Simultaneous edits in multiple open tabs are not coordinated and can overwrite each other's stored data on subsequent saves.
- **Private Browsing and Clearing Data**: Private/Incognito windows may clear `localStorage` when the session is closed. Manually clearing site data or browser cache also erases stored tasks.

## The Checks

Run the automated test suites:

```bash
npm test
```

The tests run on Node's built-in test runner (`node --test`) without external testing dependencies:
- `tests/tasks.test.js`: Covers task CRUD logic, filtering, search, sorting, counts, immutability, priority validation, form reset regression (A1), and edit lock regression (A2).
- `tests/storage.test.js`: Covers storage key constant, JSON round trips, task and list schema validation, invalid priorities/prototype keys, corrupted JSON, missing vs. empty array handling, simulated read/write failures, and isolation from other storage keys.

## Project Structure

```
task-tracker/
├── index.html            page shell with mount container
├── vite.config.js        registers React and Tailwind plugins, sets base path
├── demo.js               run-through of task functions (npm run demo)
├── tests/
│   ├── tasks.test.js     task function assertions & regressions
│   └── storage.test.js   storage validation & serialization assertions
└── src/
    ├── main.jsx          application entry point
    ├── index.css         Tailwind styles import
    ├── tasks.js          pure task management functions
    ├── storage.js        localStorage contract, validators, load and save helpers
    ├── App.jsx           React state, effects, storage integration, and layout
    └── components/
        ├── TaskInput.jsx        add-task title input, priority select, button
        ├── SearchInput.jsx      title search field
        ├── FilterButtons.jsx    status filter buttons (All / Pending / Completed)
        ├── PriorityFilter.jsx   priority filter buttons (All / Low / Medium / High)
        ├── SortSelect.jsx       order selector (Original / Priority: High to Low)
        ├── TaskList.jsx         list container or empty state notification
        ├── TaskItem.jsx         row display, responsive wrapping, Edit & Delete buttons
        ├── TaskEditor.jsx       inline edit form with title and priority controls
        └── TaskSummary.jsx      task counters and showing indicator
```
