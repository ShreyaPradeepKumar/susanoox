# Task Tracker

A task tracker built with React, JavaScript, and Tailwind CSS. Add tasks, assign priorities (Low, Medium, High), toggle completion, edit tasks in place, and filter or sort the list with instant search, status filters, priority filters, and priority sorting.

In Task 03, browser persistence via `localStorage` was added: saved tasks, completion status, priorities, and original list order survive page refreshes and browser restarts within the same browser profile.

Task 04 adds optional sample-task loading from JSONPlaceholder. Clicking **Load sample tasks** fetches five sample records, validates and converts them, and shows them in a preview. The user selects tasks and imports only those tasks; existing tasks are never replaced.

Task 05 adds an opt-in local JSON Server mode for development. Running the app with `--mode mock` stores tasks through `GET`, `POST`, `PATCH`, and `DELETE` requests to `http://127.0.0.1:3001/tasks`. The normal development and deployed builds still use browser `localStorage`; no API service is required for them.

## Running it

Normal browser/localStorage mode:

```bash
npm install
npm run dev
```

Then open http://localhost:5173/susanoox/ in your browser.

Local JSON Server mode, from `task_1/task-tracker` in two terminals:

```bash
npm --prefix mock install
npm --prefix mock run api
```

```bash
npm run dev -- --mode mock
```

Then open http://127.0.0.1:5173/susanoox/ while the API runs on `http://127.0.0.1:3001/tasks`. The first API start copies `mock/db.seed.json` to the ignored `mock/db.json`; delete `mock/db.json` to reset the data. Press `Ctrl + C` in each terminal to stop either server. The `/susanoox/` path comes from the `base` setting in `vite.config.js` — the app is deployed under that path on GitHub Pages.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local Vite development server |
| `npm run dev -- --mode mock` | Start Vite with local JSON Server mode enabled |
| `npm --prefix mock install` | Install the pinned JSON Server dependency |
| `npm --prefix mock run api` | Seed if needed, then run JSON Server on port 3001 |
| `npm test` | Run both the Node logic tests and the jsdom interface tests |
| `npm run test:unit` | Run the Node logic tests (`node --test`) only |
| `npm run test:ui` | Run the jsdom interface tests (`vitest run`) only |
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
| `temporaryMode` | Boolean flag set when stored data is invalid or unreadable, cleared after a successful confirmed replacement | No (startup and recovery state) |
| `saveError` | Error message string when writing to storage fails, else `null` | No (runtime state) |
| `pendingReplacement` | Records that a confirmed replacement failed and Retry must complete it | No (runtime state) |
| `title`, `priority` | Add-task form input and priority selection (defaults to `medium`) | No |
| `error` | Validation error message for the add-task form | No |
| `editingId`, `draftTitle`, `draftPriority`, `editError` | In-place editor state and validation draft | No |
| `search`, `filter`, `priorityFilter`, `sort` | Active view filters and sort order | No (defaults on startup) |
| `previewTasks`, `hasPreview` | Last successfully loaded sample-task preview | No |
| `selectedPreviewIds` | Preview task IDs selected for import | No |
| `isPreviewLoading`, `previewError`, `importMessage` | Request state, friendly request error, and import result message | No |
| `apiStatus`, `apiError` | API load state, error message, and retry availability in mock mode | No |
| `writeError`, `pendingWrite`, `writeMessage` | Write failure details, in-flight guard, and pending-status text in mock mode | No |

Data flows downward through props and upward through event callbacks. View controls (search, filter, priority filter, sort) do **not** mutate or create copies of the stored tasks; they derive visible tasks dynamically on each render. In local API mode, add/toggle/edit/delete use the server response as the new source of truth; browser storage is not read or written.

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

### Sample Task API (`src/taskApi.js`)

- **Endpoint**: `https://jsonplaceholder.typicode.com/todos?_limit=5`
- **Request**: One `GET` request with `Accept: application/json`, made only when the user clicks **Load sample tasks** or **Retry**. There is no automatic fetch, polling, or automatic retry.
- **Response validation**: The top level must be an array. Every record must be a non-null object, not an array, with:
  - a unique positive safe-integer `id`,
  - a positive safe-integer `userId`,
  - a non-blank string `title`,
  - a strict boolean `completed`.
  - Any invalid record rejects the whole response. An empty array is valid.
- **Conversion**: Each accepted record becomes `{ id: 'jsonplaceholder-todo-<id>', title: <trimmed title>, completed: <completed>, priority: 'medium' }`. The `userId` and extra fields are not copied.
- **Failure messages**: Network failures, non-success HTTP statuses, unreadable JSON, and unexpected response structure are reported separately with friendly messages. Failed loads leave the task list and stored data unchanged.

### Local JSON Server API mode (`src/taskCrudApi.js`)

- Enabled only when `import.meta.env.DEV && import.meta.env.MODE === 'mock'`. The normal dev server and the deployed build stay in browser/localStorage mode.
- Endpoint: `http://127.0.0.1:3001/tasks`, provided by pinned `json-server@1.0.0-beta.15` from `mock/`.
- `GET /tasks` runs once on mount and on **Retry loading**/**Reload tasks**. It validates the whole returned list; a stale response cannot overwrite a newer one.
- `POST /tasks` adds a trimmed title, `completed: false`, and the chosen priority. The returned task, including the server-generated ID, becomes the new task.
- `PATCH /tasks/:id` sends only allow-listed fields (`title`, `completed`, `priority`) with encoded IDs. Toggle and edit use the record returned by the server.
- `DELETE /tasks/:id` removes the task only after a successful response.
- Input and responses are validated before changing state. Network, HTTP, JSON-read, and schema errors are reported separately; failures never mutate the canonical list or drafts.
- A network failure during a write is marked uncertain: **Retry this change** is hidden and **Reload tasks** is offered. Definite HTTP rejections can be retried without re-entering data.
- While loading or writing, controls are disabled and a `role="status"` message shows `Loading tasks…`, `Saving new task…`, `Saving completion change…`, `Saving edit…`, or `Saving deletion…`.
- Sample-task import is hidden in this mode. API mode uses neither `localStorage` nor JSONPlaceholder.

### Import Behaviour

- The preview is separate from `tasks`. Loading replaces only the preview.
- Already imported tasks are detected by their stable `jsonplaceholder-todo-<id>` IDs. Their checkboxes are disabled and labelled **Already imported**.
- **Import selected tasks** appends only selected, not-already-imported records in preview order. Existing task order and values are unchanged, and the preview remains visible.
- After import, the selection clears, imported checkboxes remain disabled, and a status message reports how many tasks were imported.
- Imported tasks use the same canonical `tasks` state and `localStorage` persistence as manually added tasks.
- In temporary storage mode, import is allowed in memory but automatic saving stays suspended until the user replaces the stored data.
- Loading, retrying, selecting, and importing are disabled while an edit is open. A request may finish and populate the preview during editing, but import remains disabled until the edit ends.

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
- **Private Browsing and Clearing Data**: Private/Incognito windows may clear `localStorage` when the session is closed. Clearing site data for this origin (which includes `localStorage`) removes saved tasks. Clearing only cached files does not necessarily remove `localStorage`.

## The Checks

Run the automated test suites:

```bash
npm test
```

The tests run in two layers:
- `tests/tasks.test.js`, `tests/storage.test.js`, `tests/taskApi.test.js`, and `tests/taskCrudApi.test.js` use Node's built-in test runner (`node --test`) for pure logic, validation, storage helpers, sample-response validation/conversion, and local CRUD request/response contracts.
- `tests/ui/app-recovery.test.jsx`, `tests/ui/task-import.test.jsx`, and `tests/ui/local-api.test.jsx` use Vitest with jsdom and React Testing Library to exercise form resets, edit-control locking, storage recovery, sample loading, selection, import, temporary-mode integration, API-mode startup, CRUD, pending states, HTTP/network failures, and retry/reload behaviour.

`npm test` runs both layers. Use `npm run test:unit` or `npm run test:ui` to run one layer on its own.

## Project Structure

```
task-tracker/
├── index.html            page shell with mount container
├── vite.config.js        registers React and Tailwind plugins, sets base path
├── demo.js               run-through of task functions (npm run demo)
├── mock/                 pinned JSON Server for opt-in local API mode
│   ├── package.json
│   ├── package-lock.json
│   ├── db.seed.json
│   └── db.json           ignored runtime copy, created on first start
├── tests/
│   ├── tasks.test.js       task function assertions & regressions
│   ├── storage.test.js     storage validation & serialization assertions
│   ├── taskApi.test.js     sample-response validation & request assertions
│   ├── taskCrudApi.test.js local CRUD request/response contract assertions
│   └── ui/
│       ├── setup.js                    Testing Library cleanup
│       ├── app-recovery.test.jsx       interface and recovery regressions
│       ├── task-import.test.jsx        sample loading, selection, and import tests
│       └── local-api.test.jsx          API-mode startup, CRUD, and failure tests
└── src/
    ├── main.jsx          application entry point
    ├── index.css         Tailwind styles import
    ├── priority.js       shared priority values, default, and validator
    ├── tasks.js          pure task management functions
    ├── storage.js        localStorage contract, validators, load and save helpers
    ├── taskApi.js        JSONPlaceholder request, validation, and conversion
│   ├── taskCrudApi.js    local JSON Server GET/POST/PATCH/DELETE helpers
    ├── App.jsx           React state, effects, storage integration, and layout
    └── components/
        ├── TaskInput.jsx        add-task title input, priority select, button
        ├── SearchInput.jsx      title search field
        ├── FilterButtons.jsx    status filter buttons (All / Pending / Completed)
        ├── PriorityFilter.jsx   priority filter buttons (All / Low / Medium / High)
        ├── SortSelect.jsx       order selector (Original / Priority: High to Low)
        ├── TaskImport.jsx       sample-task load, preview, selection, and import
        ├── TaskList.jsx         list container or empty state notification
        ├── TaskItem.jsx         row display, responsive wrapping, Edit & Delete buttons
        ├── TaskEditor.jsx       inline edit form with title and priority controls
        └── TaskSummary.jsx      task counters and showing indicator
```
