# Task 03 Completion Report — Save and Restore Tasks

## 1. What Was Completed

### Part A: Task 02 Review Corrections

Against the findings from commit `647c0496a9cbcc0d89f5f4c02149bb2c194de664`, all five corrections were addressed and verified:

1. **A1 — Reset Priority After Adding a Task**:
   - In `src/App.jsx`, `handleAdd` now resets the title to empty (`setTitle('')`), resets the priority to `'medium'` (`setPriority('medium')`), and clears any validation message (`setError('')`) upon successful task addition.
   - The newly created task retains whichever priority was originally selected in the form.
   - If a blank title is submitted, the submission fails, returning early without resetting `priority` or `title`, so the user does not lose their selection while correcting their input.
   - Verified via regression tests in `tests/tasks.test.js`.

2. **A2 — Lock All View Controls During Editing**:
   - In `src/App.jsx`, the "Clear search and filters" button now has `disabled={isEditing}`, ensuring all view controls (Search, Status filters, Priority filters, Sort select, and Clear filters) are completely locked while an inline edit is open.
   - The explanatory banner ("Save or cancel your edit to change the list view.") remains visible throughout editing.
   - Saving or cancelling restores all controls to active state.
   - Verified via regression tests in `tests/tasks.test.js`.

3. **A3 — Improve Narrow-Screen Task Titles**:
   - In `src/components/TaskItem.jsx`, the row layout was restructured using Tailwind flex-wrap (`flex flex-wrap items-center gap-x-3 gap-y-1`).
   - On narrow viewports (< 640px), the checkbox and title occupy the first line where `flex-1 min-w-0 break-words` provides maximum readable width for ordinary words, long sentences, and unbroken text strings.
   - The priority badge, Edit button, and Delete button wrap to a second line (`w-full sm:w-auto pl-7 sm:pl-0`), neatly aligned beneath the title text.
   - Tested and verified at 320px, 375px, and desktop widths with no horizontal scroll or fragmented words.

4. **A4 — Validate Priorities Explicitly**:
   - In `src/tasks.js`, priority validation was updated from object property lookup to explicit array inclusion: `PRIORITY_VALUES.includes(value)` where `PRIORITY_VALUES = ['low', 'medium', 'high']`.
   - This strictly rejects arbitrary string values including prototype properties (`constructor`, `toString`, `__proto__`), non-strings, and unknown names.
   - The same validation rule is exported and reused across task mutations (`addTask`, `updateTask`) and stored task validation (`src/storage.js`).
   - Covered by automated assertions in `tests/tasks.test.js` and `tests/storage.test.js`.

5. **A5 — Bring Reports and Tests into Agreement**:
   - Updated `task report/task-02-completion-report.md` to document the status, rationale, and evidence for corrections A1–A5.
   - Corrected `demo.js` expected search output comment to accurately reflect the modified task list after earlier mutations.
   - Corrected `README.md` test count description to avoid hardcoded numbers that drift over time.
   - Added automated regression suites in `tests/tasks.test.js`.

---

### Part B: Task 03 Persistence Features

1. **Persistent Browser Storage**:
   - The full canonical task array is serialized to JSON and persisted to `localStorage` under the key `susanoox.task-tracker.tasks.v1`.
   - Committed additions, edits, completions, reopenings, and deletions automatically save to storage.
   - Restores valid saved tasks on application start, preserving task IDs, titles, completion states, priorities, and original list order.

2. **First Visit & Missing Key Handling**:
   - When the storage key is missing on startup, the application initializes with the four sample tasks and persists them through the normal persistence flow.
   - An existing saved list is never overwritten by defaults during startup.

3. **Deliberately Empty Task List Preservation**:
   - Deleting all tasks saves `[]` to `localStorage` without deleting the key or falling back to sample tasks.
   - Reloading with a stored `[]` displays the empty state message and preserves the empty list across refreshes.

4. **Stored Data Validation**:
   - All data retrieved from `localStorage` is parsed and validated before being passed to React state.
   - Validates that the root value is an array, every entry is a non-null object, all IDs are non-empty unique strings, titles are non-empty strings with non-whitespace content, `completed` is a boolean, and `priority` is strictly `'low'`, `'medium'`, or `'high'`.
   - Rejects the entire saved list if any item is corrupted or invalid.

5. **Invalid and Unreadable Data Recovery**:
   - If stored data fails JSON parsing or validation, or if `localStorage.getItem` throws an error:
     - The application starts with an empty temporary in-memory list (not sample tasks).
     - Existing storage contents are left completely untouched.
     - Automatic saving is suspended to prevent overwriting the existing data.
     - A warning banner alerts the user that changes are temporary.
     - A recovery action **Replace saved data with current tasks** prompts the user with a confirmation dialog (`window.confirm`). If confirmed, the in-memory tasks overwrite the storage key, the warning clears, and auto-saving resumes.

6. **Write Failure Handling and Retry**:
   - If writing to `localStorage` fails (e.g. quota exceeded or storage blocked):
     - The latest changes remain in React state so the app remains fully usable in memory.
     - A warning banner alerts the user that changes could not be saved and may be lost on refresh.
     - A **Retry saving** button allows the user to re-attempt persisting the latest task list (including any subsequent changes).
     - The warning clears only after a save write succeeds.

7. **Browser Limitation Help Text**:
   - Added clearly visible interface note: *"Tasks are saved in this browser, not to an account or cloud service."*
   - Documented origin boundaries, browser profiles, multi-tab coordination limits, and private browsing persistence in `README.md`.

---

## 2. Code Structure

### Main Files Changed

- **`src/storage.js`**:
  - `STORAGE_KEY`: Shared constant `'susanoox.task-tracker.tasks.v1'`.
  - `isValidPriority(value)`: Strict check for `'low'`, `'medium'`, `'high'`.
  - `validateTask(task)`: Validates individual task schema.
  - `validateTaskList(value)`: Validates array shape, entry schemas, and uniqueness of IDs.
  - `parseAndValidateTasks(jsonText)`: Wraps `JSON.parse` with try/catch and validates output.
  - `loadTasks(storage)`: Reads storage key, returning status `'missing'`, `'loaded'`, `'invalid'`, or `'unreadable'`.
  - `saveTasks(storage, tasks)`: Serializes and saves tasks to `STORAGE_KEY`, returning `{ success: true }` or `{ success: false, error }`. Only accesses `STORAGE_KEY`.
- **`src/App.jsx`**:
  - `getInitialStorageState()`: Reads `localStorage` once on initial mount and resolves starting state.
  - `initialStorage`: State holding the initial load outcome (`status`, `tasks`, `temporaryMode`).
  - Storage synchronization `useEffect`: Saves `tasks` to `localStorage` on committed changes when not in temporary mode; persists sample tasks on first visit if key was missing.
  - `handleReplaceStoredData()`: Confirms and executes manual overwrite of invalid storage.
  - `handleRetrySave()`: Retries persisting the latest task state after write errors.
  - Alert banners for `temporaryMode` and `saveError`.
  - Browser limitation help text in the UI footer.
- **`src/tasks.js`**:
  - Shared strict priority validation using `PRIORITY_VALUES.includes(value)`.
  - Pure, immutable task manipulation functions (`addTask`, `updateTask`, `deleteTask`, `toggleTask`, `filterTasks`, `searchTasks`, `filterByPriority`, `sortTasks`, `getCounts`).
- **`src/components/TaskItem.jsx`**:
  - Responsive row layout with wrapped action controls on narrow viewports.
- **`tests/storage.test.js`**:
  - 43 test assertions covering storage keys, JSON round trips, task validation, array validation, parse errors, load states, save operations, and storage key isolation.
- **`tests/tasks.test.js`**:
  - 44 test assertions covering pure task functions, priority validation, A1 form reset regression, and A2 edit locking regression.
- **`README.md`**:
  - Updated documentation explaining storage architecture, error recovery, and browser limitations.

### Shared Validation Rules

Both `src/tasks.js` and `src/storage.js` enforce the exact same priority rule:
```javascript
const VALID_PRIORITIES = ['low', 'medium', 'high'];
export function isValidPriority(value) {
  return VALID_PRIORITIES.includes(value);
}
```
This ensures that user input in the UI and stored records in `localStorage` conform to the identical contract.

---

## 3. Data Flow

```mermaid
flowchart TD
    A[App Startup] --> B[loadTasks from localStorage]
    B -->|Key missing| C[Initialize with startingTasks & save to storage]
    B -->|Valid JSON array| D[Initialize with saved tasks]
    B -->|Invalid JSON or read error| E[Initialize with empty [] & enter temporaryMode]
    
    C --> F[React Render Pipeline]
    D --> F
    E --> F
    
    F --> G[Derived Visible Tasks & Counts]
    
    H[User Action: Add / Edit / Toggle / Delete] --> I[Pure task function updates state]
    I --> J[React re-renders]
    
    J --> K{temporaryMode active?}
    K -->|Yes| L[Skip saving; storage untouched]
    K -->|No| M[saveTasks to localStorage]
    
    M -->|Success| N[Clear saveError]
    M -->|Failure| O[Set saveError & show Retry button]
    
    E --> P[Warning Banner displayed]
    P --> Q[User clicks Replace saved data]
    Q --> R[Browser confirm dialog]
    R -->|Confirm| S[saveTasks writes current tasks to storage]
    S -->|Success| T[Exit temporaryMode & resume auto-saving]
    R -->|Cancel| U[Keep temporaryMode & preserve storage]
```

1. **Startup**:
   - `getInitialStorageState()` calls `loadTasks(localStorage)`.
   - If status is `'loaded'`, `tasks` is initialized to the restored array.
   - If status is `'missing'`, `tasks` is initialized to the four sample tasks, and the mount effect persists them.
   - If status is `'invalid'` or `'unreadable'`, `tasks` is initialized to `[]`, and `temporaryMode` is set to `true`.
2. **Rendering**:
   - `tasks` passes through the filter/search/sort pipeline:
     `tasks -> filterTasks -> filterByPriority -> searchTasks -> sortTasks -> visibleTasks`.
   - Total/pending/completed counters are calculated from the full `tasks` list via `getCounts(tasks)`.
3. **Actions**:
   - User actions invoke pure immutable functions (`addTask`, `updateTask`, `toggleTask`, `deleteTask`).
   - The updated task array reference is passed to `setTasks`.
4. **Synchronization**:
   - A `useEffect` hook listening to `[tasks, temporaryMode, initialStorage.status]` saves the committed array via `saveTasks(localStorage, tasks)`.
   - If writing succeeds, `saveError` is cleared.
   - If writing fails, `saveError` displays an alert with a **Retry saving** button.
   - If `temporaryMode` is active, auto-saving is suspended to preserve existing storage.

---

## 4. State Ownership

| State Variable | Location | Type | Persisted? | Role |
| --- | --- | --- | --- | --- |
| `tasks` | `App.jsx` | `Array<Object>` | **Yes** (`localStorage`) | Canonical task list (source of truth). |
| `initialStorage` | `App.jsx` | `Object` | No | Initial load outcome (`status`, `tasks`, `temporaryMode`). |
| `temporaryMode` | `App.jsx` | `Boolean` | No | Indicates corrupt/unreadable storage; disables auto-save. |
| `saveError` | `App.jsx` | `String` / `null` | No | Holds storage write error message for recovery UI. |
| `title` | `App.jsx` | `String` | No | Add-task form title input draft. |
| `priority` | `App.jsx` | `String` | No | Add-task form priority selection (resets to `'medium'`). |
| `error` | `App.jsx` | `String` | No | Validation message for the add-task form. |
| `editingId` | `App.jsx` | `String` / `null` | No | ID of task currently being edited in-place. |
| `draftTitle` | `App.jsx` | `String` | No | In-place editor draft title. |
| `draftPriority` | `App.jsx` | `String` | No | In-place editor draft priority. |
| `editError` | `App.jsx` | `String` | No | Validation message for in-place editor. |
| `filter` | `App.jsx` | `String` | No | Status filter (`'all'`, `'pending'`, `'completed'`). |
| `priorityFilter`| `App.jsx` | `String` | No | Priority filter (`'all'`, `'low'`, `'medium'`, `'high'`). |
| `search` | `App.jsx` | `String` | No | Title search query string. |
| `sort` | `App.jsx` | `String` | No | Order selection (`'original'`, `'high-to-low'`). |

All transient view controls, drafts, and error states start at their default values on reload and are never written to storage.

---

## 5. Storage Contract

- **Storage Key**: `susanoox.task-tracker.tasks.v1`
- **Serialization Format**: UTF-8 JSON string encoding an array of task objects.
- **Task Schema**:
  ```json
  [
    {
      "id": "t1",
      "title": "Learn React basics",
      "completed": false,
      "priority": "high"
    }
  ]
  ```
- **Saved Fields**:
  - `id`: Non-empty string, unique within the array.
  - `title`: Non-empty string with non-whitespace characters.
  - `completed`: Boolean (`true` or `false`).
  - `priority`: String strictly matching `'low'`, `'medium'`, or `'high'`.
- **Handling Storage Conditions**:
  - *Missing Key*: First visit loads sample tasks and persists them.
  - *Empty Array `[]`*: Stored and restored as a valid empty list; does not restore sample data.
  - *Invalid Data / Schema Error*: Preserves existing storage text, opens in temporary mode with empty in-memory list, shows warning alert, and offers manual replacement.
  - *Unreadable Storage*: Catches thrown exceptions, enters temporary mode, and keeps stored data safe.
  - *Write Failures*: Keeps changes in React state, alerts the user, and offers a retry action.
  - *Key Isolation*: Storage helpers read and write exclusively to `susanoox.task-tracker.tasks.v1`, leaving any other keys on the origin untouched.

---

## 6. Verification

### Automated Test Results

Commands executed in `task_1/task-tracker`:

1. **`npm test`**:
   - Exit code: `0`
   - Test suites: `21`
   - Total tests: `87`
   - Passed: `87`
   - Failed: `0`
2. **`npm run lint`**:
   - Command: `oxlint`
   - Exit code: `0`
   - Warnings: `0`
   - Errors: `0`
3. **`npm run build`**:
   - Command: `vite build`
   - Exit code: `0`
   - Output: `dist/index.html`, `dist/assets/index-*.css`, `dist/assets/index-*.js` (built cleanly).
4. **`npm run demo`**:
   - Command: `node demo.js`
   - Exit code: `0`
   - All sample runs and assertion checks printed expected outputs.

### Verification Matrix

| Scenario | Expected Result | Actual Outcome | Status |
| --- | --- | --- | --- |
| Storage key absent | Four sample tasks load and are saved to storage | Key absent -> 4 sample tasks loaded and persisted to `localStorage` | **Pass** |
| Valid saved task list exists | Exactly that list loads; no extra sample tasks appear | Loaded custom stored array; sample tasks not added | **Pass** |
| Add a High-priority task, then refresh | Task remains High and pending; add form starts empty with Medium selected | Task persisted as High/pending; form resets to blank + Medium | **Pass** |
| Edit a completed task, then refresh | Saved title and priority remain; ID and Completed status preserved | Title/priority updated; ID and completed status preserved | **Pass** |
| Type an edit draft, then refresh without saving | Previous saved task values return; draft and editor gone | Draft discarded; original saved task restored; editor closed | **Pass** |
| Complete or reopen, then refresh | Latest saved completion state returns | Toggled completion state persisted across refresh | **Pass** |
| Delete one duplicate title, then refresh | Only the selected ID is gone; the other task remains | Only specified task removed; duplicate title task retained | **Pass** |
| Delete all tasks, then refresh or reopen | List remains empty; sample tasks do not return | Stored `[]`; empty message displayed on refresh; no samples | **Pass** |
| Filter to one task and change it, then refresh | Full saved list remains; hidden tasks not lost | Hidden filtered tasks preserved in full storage array | **Pass** |
| Sort by priority, then refresh | Original order returns; stored array order not replaced by display order | Original array order preserved in storage and restored | **Pass** |
| Change search and filters, then refresh | View controls return to defaults; task data remains saved | Controls reset to defaults; full task list remains intact | **Pass** |
| Close application tab and reopen in same profile | Last successfully saved task list returns | Storage survives tab closure and browser reopening | **Pass** |
| Stored value is broken JSON | Warning appears; original storage text remains unchanged | Broken JSON triggers warning banner; raw string untouched | **Pass** |
| Stored value is `null`, an object, or invalid records | Warning appears; original storage text remains unchanged | Validation rejects non-array/invalid shapes; storage untouched | **Pass** |
| Stored array contains duplicate IDs or invalid priorities | Entire saved list rejected without silent repair or overwrite | Validation rejects whole list; temporary mode entered | **Pass** |
| Cancel replacement of invalid data | Original storage remains untouched; temporary-mode warning remains | `window.confirm` cancelled -> storage untouched; warning kept | **Pass** |
| Confirm replacement with an empty current list | Only application key replaced with `[]`; refresh stays empty | Confirmed -> key overwritten with `[]`; auto-save resumes | **Pass** |
| Reading storage throws | App remains usable in temporary mode with warning and no auto-overwrite | Catches error; temporary mode enabled; storage safe | **Pass** |
| Writing storage throws | Current in-memory changes visible; warning explains they are not saved | Changes kept in React state; error banner + Retry shown | **Pass** |
| Make changes after failed save, then retry successfully | Latest full list saved; warning clears; refresh restores list | Retry writes latest full task list; warning clears | **Pass** |
| Another unrelated storage key exists | Value unchanged after saves and recovery | Other keys in storage remain unmodified | **Pass** |
| 320px, 375px, and desktop layouts | Titles, forms, warnings, and recovery controls remain readable and usable | Responsive flex-wrap row layout; no horizontal scroll | **Pass** |

---

## 7. Known Limitations

1. **Browser-Only Persistence**: Tasks are saved exclusively in the client's `localStorage`. They do not synchronize to an external cloud database or user account.
2. **Browser Profile & Origin Boundaries**: Data saved in one browser profile, another browser (e.g. Chrome vs Firefox), or a different origin (e.g. `localhost:5173` vs `https://ShreyaPradeepKumar.github.io`) cannot be accessed from another profile or origin.
3. **Multi-Tab Concurrency**: Simultaneous edits in multiple tabs under the same origin are not coordinated via storage events. Changes in one tab can overwrite changes from another tab if both perform writes.
4. **Private Browsing and Storage Clearing**: Using Incognito/Private mode may discard stored tasks when the private window is closed. Clearing browser site data or clearing cache permanently deletes saved tasks.

---

## 8. Learning and Assistance

- **Transient State vs Persistent Data**: Learned how component state in React is ephemeral and resets on reload, whereas `localStorage` persists data as strings across lifecycles.
- **JSON Serialization and Validation**: Learned that `JSON.parse` only confirms syntax validity, not data validity. Strict post-parse validation is critical to prevent corrupted structures or prototype injection from crashing the application.
- **Separation of Initialization and Synchronization**: Used lazy state initialization (`useState(getInitialStorageState)`) to load and validate data once on mount, and a dedicated `useEffect` to synchronize committed state changes to storage, avoiding cascading renders and uncontrolled side effects.
- **Graceful Error Recovery**: Understood the importance of non-destructive error handling—preserving invalid storage data until the user explicitly confirms replacement, rather than silently overwriting or wiping it.
- **Assistance**: Assisted by OpenCode for code suggestions, architectural guidance on React effects and validation helpers, and running tests. All implementations were inspected, refined, and validated against the test suite and browser requirements.

---

## 9. Submission Links

- **GitHub Repository**: [https://github.com/ShreyaPradeepKumar/susanoox](https://github.com/ShreyaPradeepKumar/susanoox)
- **Tested Commit**: `dde7153` (and latest Task 03 completion commit)
- **Deployed Application**: [https://ShreyaPradeepKumar.github.io/susanoox/](https://ShreyaPradeepKumar.github.io/susanoox/)
