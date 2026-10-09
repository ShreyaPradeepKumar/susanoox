# Task Tracker

A simple task list built with React, JavaScript and Tailwind CSS. Add a task,
give it a priority, tick it off, edit it in place, and narrow the list with
search and filters. The list lives in memory only, starting from four sample
tasks.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5173/susanoox/ in your browser.

(`npm install` only needs running once. To stop the dev server, press
`Ctrl + C` in the terminal running it. The `/susanoox/` path comes from the
`base` setting in `vite.config.js` — the app is deployed under that path on
GitHub Pages.)

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Run the checks in `tests/tasks.test.js` |
| `npm run demo` | Print a run-through of the nine task functions |
| `npm run build` | Create a production copy in `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Check the code for problems |

## How it fits together

`App.jsx` owns everything in twelve pieces of React state:

| State | What it holds |
| --- | --- |
| `tasks` | the task list itself — the source of truth |
| `title`, `priority` | the Add form |
| `search`, `filter`, `priorityFilter`, `sort` | the four view controls |
| `error` | the Add form's validation message |
| `editingId`, `draftTitle`, `draftPriority`, `editError` | the open editor's draft |

The nine components in `components/` only display that data and report clicks
back up to `App`. Data flows one way: downward through props, upward through
callbacks.

The view controls are **not** copies of the list — they are windows onto it.
Search, both filters and sorting are applied to `tasks` on every render and
only the result is displayed, so nothing a filter does can ever change a task.

The task logic lives in `src/tasks.js` as plain JavaScript functions, kept
separate from React so they can be tested and reused on their own:

| Function | Purpose |
| --- | --- |
| `addTask(tasks, title, priority)` | Adds a task, trimming the title and setting its priority (defaults to `'medium'`). Rejects empty or whitespace-only titles |
| `updateTask(tasks, id, title, priority)` | Replaces the title and priority of one task. Rejects a blank title or an unknown id |
| `deleteTask(tasks, id)` | Removes the task with the matching id |
| `toggleTask(tasks, id)` | Flips one task between pending and completed |
| `filterTasks(tasks, status)` | Returns tasks matching `'all'`, `'pending'` or `'completed'` |
| `searchTasks(tasks, query)` | Returns tasks whose title contains the text, ignoring capitals and surrounding spaces |
| `filterByPriority(tasks, priority)` | Returns tasks matching `'all'`, `'low'`, `'medium'` or `'high'` |
| `sortTasks(tasks, order)` | Returns a copy sorted `'high-to-low'`, or the original list for `'original'` |
| `getCounts(tasks)` | Returns `{ total, pending, completed }` — always over the **whole** list, never the filtered view |

None of these functions edit the list you pass in. A valid change returns a
**new** array; a rejected change (a blank title) returns the **original array
unchanged**, so a caller can tell the two apart by comparing references. React
relies on this: it re-renders when it receives a new array, and ignores the
change when it gets the same one back.

Because `getCounts` always describes every task, the counts can differ from
what is on screen — that is what the separate `Showing X of Y tasks` line is
for.

## The checks

```bash
npm test
```

`tests/tasks.test.js` holds 33 assertions covering every function: results,
the "returns the same array when rejected" rule, and the case-insensitivity of
search. They run on Node's built-in test runner with `node:assert`, so no
extra packages are installed. If a check breaks the run exits non-zero and
prints what was expected versus what actually happened.

## Trying the functions on their own

`demo.js` imports the nine functions and runs them against four sample tasks,
printing the result of each step: adding with and without a priority,
rejecting a blank title, updating, toggling, deleting, searching, filtering by
status and priority, sorting, and counting.

```bash
npm run demo
```

It is kept out of `src/` and nothing imports it, so it never runs in the
browser and never affects the app.

## Project structure

```
task-tracker/
├── index.html            page shell, contains an empty <div id="root">
├── vite.config.js        registers the react and tailwind plugins, sets the base path
├── demo.js               run-through of the nine functions (npm run demo)
├── tests/
│   └── tasks.test.js     33 assertions (npm test)
└── src/
    ├── main.jsx          entry point, renders <App />
    ├── index.css         one line: @import "tailwindcss";
    ├── tasks.js          the nine task functions
    ├── App.jsx           the useState hooks and event handlers
    └── components/
        ├── TaskInput.jsx        title input, priority select, Add button, error
        ├── SearchInput.jsx      the search box, beside the heading
        ├── FilterButtons.jsx    All / Pending / Completed
        ├── PriorityFilter.jsx   All / Low / Medium / High
        ├── SortSelect.jsx       Original order / Priority: High to Low
        ├── TaskList.jsx         the list, or an empty message
        ├── TaskItem.jsx         one row: checkbox, title, priority, Edit, Delete
        ├── TaskEditor.jsx       the in-row form: title, priority, Save, Cancel
        └── TaskSummary.jsx      the counts and the "Showing X of Y" line
```

## Where the data lives, and its limitation

The task list, the edit drafts and the four view controls all live in React
state in `App.jsx`. Nothing is written anywhere else — there is no storage,
database or backend.

The app starts from, and refreshing returns to, the four sample tasks (`t1` –
`t4`) defined at the top of `App.jsx`. **Changes are not saved:** any task you
add, edit, complete or delete during a session is lost on refresh. That is
deliberate — browser storage and persistence are outside this assignment, so
the task list exists in memory only.
